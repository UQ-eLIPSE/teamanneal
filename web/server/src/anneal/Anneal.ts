import * as Logger from "../core/Logger";
// import * as Util from "../core/Util";

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

import { CountConstraint } from "./CountConstraint";
import { LimitConstraint } from "./LimitConstraint";
import { SimilarityNumericConstraint } from "./SimilarityNumericConstraint";
import { SimilarityStringConstraint } from "./SimilarityStringConstraint";

import { AnnealRecordPointerArray } from "./AnnealRecordPointerArray";
import { AnnealStratum } from "./AnnealStratum";
import { AnnealStratumNode } from "./AnnealStratumNode";

const globalLogger = Logger.getGlobal();
const log = Logger.log(globalLogger);

export function anneal(sourceData: SourceData.DescBase & SourceData.Partitioned, strata: ReadonlyArray<Stratum.Desc>, constraints: ReadonlyArray<Constraint.Desc>) {
    // Generate column information objects
    const columnInfos = ColumnInfo.initManyFromSourceData(sourceData);

    // Operate per partition (isolated data sets - can be parallelised)
    log("info")(`Starting anneal`);

    const partitions = sourceData.records;
    const output = partitions.map((partition, i) => {
        log("info")(`Annealing partition ${i + 1}`);
        return annealPartition(partition, columnInfos, strata, constraints);
    });

    log("info")(`Finished anneal`);

    return output;
}

function annealPartition(partition: Record.RecordSet, columnInfos: ReadonlyArray<ColumnInfo.ColumnInfo>, strataDefs: ReadonlyArray<Stratum.Desc>, constraintDefs: ReadonlyArray<Constraint.Desc>) {
    // Fix random seed for debugging
    // Random.setSeed(0xDEADBEEF);

    /// ============================================
    /// Structuring the data into views over records
    /// ============================================

    // A linear array store that holds pointers to records in the partition
    const numberOfRecords = partition.length;
    const recordPointers = new AnnealRecordPointerArray(numberOfRecords);

    // Give records a shuffle before we start
    recordPointers.shuffle();


    /// =======================
    /// Configuring constraints
    /// =======================

    // Convert each constraint definition into constraint objects
    const constraints = constraintDefs.map((constraintDef) => {
        const colIndex = constraintDef.filter.column;
        const columnInfo = columnInfos[colIndex];

        switch (constraintDef.type) {
            case "count": return new CountConstraint(partition, columnInfo, constraintDef);
            case "limit": return new LimitConstraint(partition, columnInfo, constraintDef);
            case "similarity": {
                // Check what the column type is
                switch (columnInfo.type) {
                    case "number": return new SimilarityNumericConstraint(partition, columnInfo, constraintDef);
                    case "string": return new SimilarityStringConstraint(partition, columnInfo, constraintDef);
                }

                throw new Error("Unknown column type");
            }
        }

        throw new Error("Unknown constraint type");
    });



    /// ===================
    /// Constructing strata
    /// ===================

    // Go through each stratum and create nodes that refer to views on record
    // pointers in the record store
    const strata: AnnealStratum[] = [];

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



    /// =======================
    /// Calculating temperature
    /// =======================

    log("info")("Deriving temperature...");
    const startTemp = deriveStartingTemperature(recordPointers, strata);



    /// ====================
    /// Loop over iterations
    /// ====================

    log("info")("Iterating...");

    const defaultBranchIterationScalar: number = 4;
    const defaultAvgUphillProbabilityThreshold: number = 0.0025;

    // Track uphill probabilities
    const uphillTracker = UphillTracker.init();

    // Running numbers
    let $ = Number.POSITIVE_INFINITY;   // cost
    let T = startTemp;                  // temperature

    // Iteration scalar adjusts the number of mutation trials per branch
    let branchIterationScalar = defaultBranchIterationScalar;

    while (true) {
        // Run iterations per branch as determined by `itScalar` and number of
        // records
        // const numberOfIterationsInOneBranch = branchIterationScalar * numberOfRecords;
        const numberOfIterationsInOneBranch = (0.9 * branchIterationScalar * numberOfRecords) >>> 0;



        // Before we enter branch iterations, save cost, state
        const previousCost = $;
        recordPointers.saveToStoreA();



        /// ====================================================================
        /// anneal_inner_loop (one branch)
        /// ====================================================================
        {
            // Reset uphill accept/reject
            UphillTracker.resetAcceptReject(uphillTracker);

            // Iterate over one "branch"
            for (let j = 0; j < numberOfIterationsInOneBranch; ++j) {
                // Take state snapshot now
                recordPointers.saveToStoreB();

                // Perform random op
                //
                // We only need to mutate the leaf nodes (swap, move, etc.)
                // This is done via. the immediate parent - which are the lowest
                // stratum nodes (index = 0)
                const modifiedPointerIndicies = MutationOperation.randPick()(strata[0]);
                modifiedPointerIndicies;

                // Wipe costs on nodes with modified record pointers
                // CostCompute.wipeAllCost(strata);
                CostCompute.wipeCost(strata, modifiedPointerIndicies);

                // Calculate total cost
                const newCost = CostCompute.computeCost(strata);
                // const deltaCost = Iteration.calculateCostDifference($, newCost);
                // const deltaCost = newCost - $;

                // Determine if this iteration is accepted
                const iterationAccepted = Iteration.isNewCostAcceptable(T, $, newCost);

                // Update uphill tracker for new costs which are higher
                // ("uphill") compared to existing cost
                if (newCost > $) {
                    if (iterationAccepted) {
                        UphillTracker.incrementAccept(uphillTracker);
                    } else {
                        UphillTracker.incrementReject(uphillTracker);
                    }
                }

                if (iterationAccepted) {
                    // Update cost
                    $ = newCost;
                } else {
                    // Restore previous state
                    recordPointers.loadFromStoreB();

                    // You must wipe costs when loading from store
                    CostCompute.wipeCost(strata, modifiedPointerIndicies);
                }
            }

            // Update temperature at the end of one branch
            T = Iteration.calculateNewTemperature(T);
        }



        // Restore previous state if cost before this branch was better
        if (previousCost < $) {
            $ = previousCost;
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

        if (Iteration.isResultPerfect($)) { break; }
        if (Iteration.isTemperatureExhausted(T)) { break; }

        const avgUphillProbability = UphillTracker.updateProbabilityHistory(uphillTracker);
        if (avgUphillProbability < defaultAvgUphillProbabilityThreshold) {
            break;
        }
    }



    // Output constraint satisfaction
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

    log("info")(`Satisfaction
${JSON.stringify(satisfaction)}`);

    // return convertNodeToArray(partition, rootNode, strataDefs.length);
    return;
}

/**
 * Derives starting temperature.
 */
function deriveStartingTemperature(recordPointers: AnnealRecordPointerArray, strata: ReadonlyArray<AnnealStratum>) {
    const tempDerSamples = 200;

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
        modifiedPointerIndicies;

        // Wipe costs on nodes with modified record pointers
        // CostCompute.wipeAllCost(strata);
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
    }

    // Derive the starting temperature
    const startTemp = TemperatureDerivation.deriveTemperature(tempDer);

    // Restore root node to original state before we exit
    recordPointers.loadFromStoreA();

    // You must wipe costs when reloading from store
    CostCompute.wipeAllCost(strata);

    return startTemp;
}
