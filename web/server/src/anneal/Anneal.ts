// Interfaces
import * as SourceData from "../../../common/SourceData";
import * as Stratum from "../../../common/Stratum";
import * as Constraint from "../../../common/Constraint";
import * as Record from "../../../common/Record";

// Data manipulation and structures
import * as GroupDistribution from "../data/GroupDistribution";
import * as ColumnInfo from "../data/ColumnInfo";
// import * as Random from "../data/Random";

// Anneal-related
import * as CostCompute from "./CostCompute";
import * as MutationOperation from "./MutationOperation";
import * as Iteration from "./Iteration";
import * as UphillTracker from "./UphillTracker";
import * as TemperatureDerivation from "./TemperatureDerivation";
import * as ConstraintSatisfaction from "./ConstraintSatisfaction";

import { AbstractConstraint } from "./AbstractConstraint";
import { CountConstraint } from "./CountConstraint";
import { LimitConstraint } from "./LimitConstraint";
import { SimilarityNumericConstraint } from "./SimilarityNumericConstraint";
import { SimilarityStringConstraint } from "./SimilarityStringConstraint";

import { AnnealRecordPointerArray } from "./AnnealRecordPointerArray";
import { AnnealStratum } from "./AnnealStratum";
import { AnnealStratumNode } from "./AnnealStratumNode";

export function anneal(sourceData: SourceData.DescBase & SourceData.Partitioned, strata: ReadonlyArray<Stratum.Desc>, constraints: ReadonlyArray<Constraint.Desc>) {
    // Generate column information objects
    const columnInfos = ColumnInfo.initManyFromSourceData(sourceData);

    // Check that constraints array is not empty
    if (constraints.length === 0) {
        throw new Error("Constraints array is empty; aborting anneal");
    }

    // Operate per partition (isolated data sets - can be parallelised)
    console.log(`Starting anneal`);

    const partitions = sourceData.records;
    const output = partitions.map((partition, i) => {
        console.log(`Annealing partition ${i + 1}`);
        return annealPartition(partition, columnInfos, strata, constraints);
    });

    console.log(`Finished anneal`);

    return output;
}

function annealPartition(partition: Record.RecordSet, columnInfos: ReadonlyArray<ColumnInfo.ColumnInfo>, strataDefs: ReadonlyArray<Stratum.Desc>, constraintDefs: ReadonlyArray<Constraint.Desc>) {
    // Fix random seed for debugging
    // Random.setSeed(0xDEADBEEF);

    /// ============================================
    /// Structuring the data into views over records
    /// ============================================

    // A linear array store that holds pointers to records in the partition
    console.log("Creating record pointers...");
    const recordPointers = createAnnealRecordPointerArray(partition.length);


    /// =======================
    /// Configuring constraints
    /// =======================

    console.log("Creating constraint obj...");
    const constraints = createConstraintObjects(partition, columnInfos, constraintDefs);



    /// ===================
    /// Constructing strata
    /// ===================

    console.log("Creating strata obj...");
    const strata = createStrataObjects(recordPointers, constraints, strataDefs);



    /// =======================
    /// Calculating temperature
    /// =======================

    console.log("Deriving temperature...");
    const startTemp = deriveStartingTemperature(recordPointers, strata);



    /// ====================
    /// Loop over iterations
    /// ====================

    console.log("Iterating...");
    annealOuterLoop(recordPointers, strata, startTemp);



    // Output constraint satisfaction
    const satisfaction = generateSatisfactionArray(constraints, strata);

    console.log(`Satisfaction
${JSON.stringify(satisfaction)}`);

    return convertStrataToArray(strata, partition);
}

/**
 * Derives starting temperature.
 */
function deriveStartingTemperature(recordPointers: AnnealRecordPointerArray, strata: ReadonlyArray<AnnealStratum>) {
    const tempDerSamples = 200;

    // We define a maximum number of iterations to run for deriving the starting
    // temperature because some anneal configurations may have few uphill costs
    // being accumulated, leading to a long running derivation loop or even
    // infinite loops
    const maximumLoopIterations = 1e7 >>> 0;    // 10 million
    let loopIterationCount = 0;

    // Preserve the initial state
    recordPointers.saveToStoreA();

    // Temperature derivation object
    const tempDer = TemperatureDerivation.init(tempDerSamples);

    // Running cost for temperature derivation process
    let tempDerCurrentCost: number | undefined = undefined;

    while (!TemperatureDerivation.isReadyForDerivation(tempDer)) {
        // NOTE: We do not care about resetting state on every loop;
        // this is the same for the original TeamAnneal code as it
        // continuously runs moves without regard for restoring the
        // previous/original state

        // Perform random op
        //
        // We only need to mutate the leaf nodes (swap, move, etc.)
        // This is done via. the immediate parent - which are the lowest
        // stratum nodes (index = 0)
        const modifiedPointerIndicies = MutationOperation.randPick()(strata[0]);

        // Wipe costs on nodes with modified record pointers
        CostCompute.wipeCost(strata, modifiedPointerIndicies);

        // Calculate cost
        const newCost = CostCompute.computeCost(strata);

        // Assign cost at start
        if (tempDerCurrentCost === undefined) {
            tempDerCurrentCost = newCost;
            continue;
        }

        // Only accumulate uphill cost differences to the temperature
        // derivation object
        const costDiff = Iteration.calculateCostDifference(tempDerCurrentCost, newCost);

        if (costDiff > 0) {
            TemperatureDerivation.pushCostDelta(tempDer, costDiff);
        }

        // Update the new current cost, as we don't reset the state
        tempDerCurrentCost = newCost;

        // Throw when maximum number of iterations reached
        if (++loopIterationCount >= maximumLoopIterations) {
            throw new Error(`Maximum number of iterations reached in starting temperature derivation loop; ${tempDer.costArray.length} of ${tempDer.size} slots filled`);
        }
    }

    // Derive the starting temperature
    const startTemp = TemperatureDerivation.deriveTemperature(tempDer);

    // Restore root node to original state before we exit
    recordPointers.loadFromStoreA();

    // You must wipe costs when reloading from store
    CostCompute.wipeAllCost(strata);

    return startTemp;
}




/**
 * Creates nested arrays that represent the strata structure
 * 
 * e.g.:
 * 
 *      [                            // All top level nodes
 *          [                        // Stratum 1 node
 *              [                    // Stratum 0 node
 *                  [record data],
 *                  [record data],
 *                  [record data],
 *                  [record data]
 *              ],
 *              [                    // Stratum 0 node
 *                  [record data],
 *                  [record data],
 *                  [record data],
 *                  [record data]
 *              ]
 *          ],
 *          ...
 *      ]
 */
function convertStrataToArray(strata: ReadonlyArray<AnnealStratum>, records: Record.RecordSet) {
    // TODO: Need to better describe nested arrays of unknown depth
    type UnknownDepthNestedArray = any[];

    const numberOfStrata = strata.length;

    // Nothing to process if there aren't strata
    if (numberOfStrata < 1) {
        return [];
    }

    // Map out the lowest stratum first
    const lowestStratumArray = strata[0].nodes.map(
        (node) => {
            const recordDataArray: Record.Record[] = [];

            node.getRecordPointers().forEach((recordPointer) => {
                const recordData = records[recordPointer];
                recordDataArray.push(recordData);
            });

            return recordDataArray;
        }
    );

    // We now go up strata one by one and nest the previous stratum's nodes
    let previousStratumArray: UnknownDepthNestedArray = lowestStratumArray;

    for (let i = 1; i < numberOfStrata; ++i) {
        const previousStratumNodes = strata[i - 1].nodes;
        const thisStratumNodes = strata[i].nodes;

        const currentStratumArray: UnknownDepthNestedArray = [];

        // Go through each of this stratum's nodes, and bundle up previous 
        // stratum nodes
        let previousStratumNodeIndex = 0;

        for (let j = 0; j < thisStratumNodes.length; ++j) {
            const thisStratumNode = thisStratumNodes[j];
            const thisStratumNodeDataArray: UnknownDepthNestedArray = [];

            while (true) {
                const previousStratumNode: AnnealStratumNode | undefined = previousStratumNodes[previousStratumNodeIndex];

                // If we get `undefined`, we have hit the end; or
                // if we hit substratum nodes which are no longer within
                // this stratum node's range, we move on to the next node
                if ((previousStratumNode === undefined) || !thisStratumNode.isNodeInRange(previousStratumNode)) {
                    break;
                }

                // If the previous stratum node being pointed to falls under
                // the current stratum node, we push in the array that is held
                // in `previousStratumArray`
                thisStratumNodeDataArray.push(previousStratumArray[previousStratumNodeIndex]);

                // Move on to the next substratum node
                ++previousStratumNodeIndex;
            }

            // Push in this stratum node's array of substrata data arrays
            currentStratumArray.push(thisStratumNodeDataArray);
        }

        // We have now finished with all of this stratum's nodes;
        // prepare for next stratum iteration
        previousStratumArray = currentStratumArray;
    }

    // The output is the array last set by the top stratum:
    //      `previousStratumArray` points to the `currentStratumArray` at the
    //      end of the last iteration
    return previousStratumArray;
}

function createAnnealRecordPointerArray(numberOfRecords: number) {
    const recordPointers = new AnnealRecordPointerArray(numberOfRecords);

    // Give records a shuffle before we start
    recordPointers.shuffle();

    return recordPointers;
}

function createConstraintObjects(records: Record.RecordSet, columnInfos: ReadonlyArray<ColumnInfo.ColumnInfo>, constraintDefs: ReadonlyArray<Constraint.Desc>): ReadonlyArray<AbstractConstraint> {
    // Convert each constraint definition into constraint objects
    const constraints =
        constraintDefs.map((constraintDef) => {
            const colIndex = constraintDef.filter.column;
            const columnInfo = columnInfos[colIndex];

            switch (constraintDef.type) {
                case "count": return new CountConstraint(records, columnInfo, constraintDef);
                case "limit": return new LimitConstraint(records, columnInfo, constraintDef);
                case "similarity": {
                    // Check what the column type is
                    switch (columnInfo.type) {
                        case "number": return new SimilarityNumericConstraint(records, columnInfo, constraintDef);
                        case "string": return new SimilarityStringConstraint(records, columnInfo, constraintDef);
                    }

                    throw new Error("Unknown column type");
                }
            }

            throw new Error("Unknown constraint type");
        });

    return constraints;
}

function createStrataObjects(recordPointers: AnnealRecordPointerArray, constraints: ReadonlyArray<AbstractConstraint>, strataDefs: ReadonlyArray<Stratum.Desc>): ReadonlyArray<AnnealStratum> {
    // Go through each stratum and create nodes that refer to views on record
    // pointers in the record store
    const strata: AnnealStratum[] = [];
    const numberOfRecords = recordPointers.numberOfRecords;

    for (let stratumIndex = 0; stratumIndex < strataDefs.length; ++stratumIndex) {
        const stratumDef = strataDefs[stratumIndex];

        // For the lowest stratum, we take records directly from the store,
        // otherwise we take the previous stratum we generated and directly init
        // a node from that
        const nodes: AnnealStratumNode[] = [];

        if (stratumIndex === 0) {
            const buffer = recordPointers.workingSet.buffer;
            const numberOfGroups = GroupDistribution.calculateNumberOfGroups(numberOfRecords, stratumDef.size.min, stratumDef.size.ideal, stratumDef.size.max, false);

            const minGroupSize = (numberOfRecords / numberOfGroups) >>> 0;
            let leftOver = numberOfRecords % numberOfGroups;

            let offset: number = 0;

            for (let i = 0; i < numberOfGroups; ++i) {
                let groupSize = minGroupSize;

                // If there are left overs, add one in to this group
                if (leftOver > 0) {
                    ++groupSize;
                    --leftOver;
                }

                // Init new node
                nodes.push(new AnnealStratumNode(buffer, offset, groupSize));

                // Update `offset` of next round
                offset = offset + groupSize;
            }
        } else {
            const prevStratumNodes = strata[stratumIndex - 1].nodes;
            const numberOfPrevStratumNodes = prevStratumNodes.length;

            const numberOfGroups = GroupDistribution.calculateNumberOfGroups(prevStratumNodes.length, stratumDef.size.min, stratumDef.size.ideal, stratumDef.size.max, false);

            const minGroupSize = (numberOfPrevStratumNodes / numberOfGroups) >>> 0;
            let leftOver = numberOfPrevStratumNodes % numberOfGroups;

            let offset: number = 0;

            for (let i = 0; i < numberOfGroups; ++i) {
                let groupSize = minGroupSize;

                // If there are left overs, add one in to this group
                if (leftOver > 0) {
                    ++groupSize;
                    --leftOver;
                }

                // Init new node
                nodes.push(AnnealStratumNode.initFromChildren(prevStratumNodes.slice(offset, offset + groupSize)));

                // Update `offset` of next round
                offset = offset + groupSize;
            }
        }


        const stratumConstraints = constraints.filter(constraint => constraint.constraintDef.strata === stratumIndex);

        strata.push(new AnnealStratum(nodes, stratumConstraints));
    }

    return strata;
}

function generateSatisfactionArray(constraints: ReadonlyArray<AbstractConstraint>, strata: ReadonlyArray<AnnealStratum>): ReadonlyArray<ReadonlyArray<ReadonlyArray<number | undefined>>> {
    const satisfaction =
        strata.map((stratum, stratumIndex) => {         // For each stratum,
            return stratum.nodes.map(node => {          // and for each node in that stratum,
                return constraints.map(constraint => {  // go through all constraints

                    // If this constraint does not apply to the stratum, return
                    // undefined
                    if (constraint.constraintDef.strata !== stratumIndex) {
                        return undefined;
                    }

                    // Return the actual satisfaction value (in range [0,1])
                    return ConstraintSatisfaction.calculateSatisfaction(constraint, node);
                });
            });
        });

    return satisfaction;
}

function annealOuterLoop(recordPointers: AnnealRecordPointerArray, strata: ReadonlyArray<AnnealStratum>, startTemp: number) {
    const defaultBranchIterationScalar: number = 4;
    const defaultAvgUphillProbabilityThreshold: number = 0.0025;

    const numberOfRecords = recordPointers.numberOfRecords;

    // Track uphill probabilities
    const uphillTracker = UphillTracker.init();

    // Running numbers
    const trackedParam = {
        $: Number.POSITIVE_INFINITY,    // cost
        T: startTemp,                   // temperature
    }

    // Iteration scalar adjusts the number of mutation trials per branch
    let branchIterationScalar = defaultBranchIterationScalar;

    while (true) {
        // Run iterations per branch as determined by `itScalar` and number of
        // records
        // This number is multiplied by 0.9 because the original C++ code had
        // 10% no-ops
        const numberOfIterationsInOneBranch = (0.9 * branchIterationScalar * numberOfRecords) >>> 0;

        // Before we enter branch iterations, save cost, state
        const previousCost = trackedParam.$;
        recordPointers.saveToStoreA();

        // Reset uphill accept/reject
        UphillTracker.resetAcceptReject(uphillTracker);




        /// ====================================================================
        /// anneal_inner_loop (one branch)
        /// ====================================================================
        annealBranchLoop(recordPointers, strata, uphillTracker, trackedParam, numberOfIterationsInOneBranch);





        // Restore previous state if cost before this branch was better
        if (previousCost < trackedParam.$) {
            trackedParam.$ = previousCost;
            recordPointers.loadFromStoreA();

            // You must wipe costs when reloading from store
            CostCompute.wipeAllCost(strata);

            // TODO: Investigate better cost management when reloading from store
        }

        // Tweak iteration scalar depending on uphill probability
        const uphillAcceptanceProbability = UphillTracker.getAcceptanceProbability(uphillTracker);

        if (uphillAcceptanceProbability > 0.7 || uphillAcceptanceProbability < 0.2) {
            branchIterationScalar = 4;
        } else if (uphillAcceptanceProbability > 0.6 || uphillAcceptanceProbability < 0.3) {
            branchIterationScalar = 8;
        } else {
            branchIterationScalar = 32;
        }

        // Stop conditions
        if (Iteration.isResultPerfect(trackedParam.$)) { break; }
        if (Iteration.isTemperatureExhausted(trackedParam.T)) { break; }

        const avgUphillProbability = UphillTracker.updateProbabilityHistory(uphillTracker);
        if (avgUphillProbability < defaultAvgUphillProbabilityThreshold) {
            break;
        }
    }
}

function annealBranchLoop(recordPointers: AnnealRecordPointerArray, strata: ReadonlyArray<AnnealStratum>, uphillTracker: UphillTracker.UphillTracker, trackedParam: { $: number, T: number }, numberOfIterations: number) {
    // Iterate over one "branch"
    for (let i = 0; i < numberOfIterations; ++i) {
        // Take state snapshot now
        recordPointers.saveToStoreB();

        // Perform random op
        //
        // We only need to mutate the leaf nodes (swap, move, etc.)
        // This is done via. the immediate parent - which are the lowest
        // stratum nodes (index = 0)
        const modifiedPointerIndicies = MutationOperation.randPick()(strata[0]);

        // Wipe costs on nodes with modified record pointers
        CostCompute.wipeCost(strata, modifiedPointerIndicies);

        // Calculate total cost
        const newCost = CostCompute.computeCost(strata);

        // Determine if this iteration is accepted
        const iterationAccepted = Iteration.isNewCostAcceptable(trackedParam.T, trackedParam.$, newCost);

        // Update uphill tracker for new costs which are higher
        // ("uphill") compared to existing cost
        if (newCost > trackedParam.$) {
            if (iterationAccepted) {
                UphillTracker.incrementAccept(uphillTracker);
            } else {
                UphillTracker.incrementReject(uphillTracker);
            }
        }

        if (iterationAccepted) {
            // Update cost
            trackedParam.$ = newCost;
        } else {
            // Restore previous state
            recordPointers.loadFromStoreB();

            // You must wipe costs when loading from store
            CostCompute.wipeCost(strata, modifiedPointerIndicies);
        }
    }

    // Update temperature at the end of one branch
    trackedParam.T = Iteration.calculateNewTemperature(trackedParam.T);
}
