// Interfaces
import * as RecordData from "../../../common/RecordData";
import * as Constraint from "../../../common/Constraint";
import * as AnnealNode from "../../../common/AnnealNode";
import * as Stratum from "../../../common/Stratum";
import * as Record from "../../../common/Record";

// Data manipulation and structures
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
import { AnnealStratumNodeStub } from "./AnnealStratumNodeStub";

export function anneal(annealRootNode: AnnealNode.NodeRoot, recordData: RecordData.Desc, strataDefinitions: ReadonlyArray<Stratum.Desc>, constraintDefinitions: ReadonlyArray<Constraint.Desc>) {
    // Fix random seed for debugging
    // Random.setSeed(0xDEADBEEF);

    // Check that constraints array is not empty
    if (constraintDefinitions.length === 0) {
        throw new Error("Constraints array is empty; aborting anneal");
    }



    /// ==================
    /// Processing records
    /// ==================

    const { records, columns } = recordData;

    // Generate column information objects
    //
    // Note that this uses information from the WHOLE set of records, not just
    // filtered records
    const columnInfos = columns.map((column, i) => ColumnInfo.initFromColumnIndex(records, i, column));

    // Find the ID column
    const idColumnIndex = columns.findIndex(x => x.isId);

    if (idColumnIndex < 0) {
        throw new Error("No ID column found");
    }

    // Filter records so that we are only working with records for this anneal 
    // node
    const thisNodeRecords = filterRecordData(annealRootNode, idColumnIndex, records);



    /// ============================================
    /// Structuring the data into views over records
    /// ============================================

    // A linear array store that holds pointers to records in the partition
    console.log("Creating record pointers...");
    const recordPointers = createAnnealRecordPointerArray();

    // !!!!!!!!!!!!!!!!
    // TODO: Actually, the record pointer array needs to have pointers encoded
    //       that point to whatever the input nodes are
    //       
    //       Maybe create an array buffer that's blank first, then come back
    //       and reencode with content = [filteredRecords].indexOf(record)
    // !!!!!!!!!!!!!!!!



    /// =======================
    /// Configuring constraints
    /// =======================

    console.log("Creating constraint obj...");
    const constraints = createConstraintObjects(thisNodeRecords, columnInfos, constraintDefinitions);



    /// ======================================
    /// Transforming nodes/constructing strata
    /// ======================================

    // Transform "anneal request nodes" into "anneal stratum nodes" that the
    // annealing code on the server uses

    // Note that strata generation is a four step process:
    //  1. Generate stubs
    //  2. Run through all stubs to calculate their sizes
    //  3. Generate actual nodes that have array buffer allocation aligned to
    //     the expected sizes for each node
    //  4. Bundle the stratum nodes into AnnealStratum objects

    console.log("Transforming anneal request nodes...");

    // (1)
    const stratumRootNodeStub = translateAnnealNodeToStratumNode(annealRootNode);

    // (2)
    const numberOfRecordsInStubs = calculateStratumNodeStubSize(stratumRootNodeStub);

    // Quick sanity check to make sure that we do indeed have the correct number
    // of records in stub tree
    if (numberOfRecordsInStubs !== thisNodeRecords.length) {
        throw new Error("Number of records in stratum node stubs do not match length of filtered records");
    }

    // (3)
    const nodesPerStratum: AnnealStratumNode[][] = [];

    // Prepopulate blank strata node arrays
    for (let i = 0; i < strataDefinitions.length; ++i) {
        nodesPerStratum.push([]);
    }

    generateStratumNodes(recordPointers.workingSet.buffer, nodesPerStratum, stratumRootNodeStub, strataDefinitions.length - 1, 0);

    // (4)
    console.log("Creating strata...");

    const strata = nodesPerStratum.map((nodes, i) => {
        const stratumId = strataDefinitions[i]._id;
        const stratumConstraints = constraints.filter(c => c.constraintDef.stratum === stratumId);
        return new AnnealStratum(stratumId, nodes, stratumConstraints);
    });



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
    console.log("Anneal complete");



    const output = {
        satisfaction: generateSatisfactionArray(constraints, strata),
        result: convertStrataToArray(strata, partition),
    };

    // TODO: Satisfaction information to be delivered to client in TA-93
    const { result, /* satisfaction,*/ } = output;

    return result;
}

function filterRecordData(rootNode: AnnealNode.NodeRoot, idColumnIndex: number, records: Record.RecordSet) {
    // Get records which have an ID that is specified in some node's set of 
    // record children
    const idValues = extractRecordIdsFromNode(rootNode);

    // Retrieve only records that are contained in this anneal node
    const filteredRecords = records.filter((record) => {
        const idValue = record[idColumnIndex];
        return idValues.indexOf(idValue) > -1;
    });

    // Also check that record IDs have not been used twice or that records were
    // not found
    if (filteredRecords.length !== idValues.length) {
        throw new Error("Duplicate or invalid record ID references under anneal node");
    }

    return filteredRecords;
}

function extractRecordIdsFromNode(rootNode: AnnealNode.NodeRoot) {
    // Compile array of ID values which sit under this node
    const thisNodeIdValues: Record.RecordElement[] = [];

    const collectIdValues =
        (node: AnnealNode.NodeStratumWithRecordChildren | AnnealNode.NodeStratumWithStratumChildren) => {
            if (node.type === "stratum-records") {
                thisNodeIdValues.push(...node.recordIds);
            } else {
                node.children.forEach(collectIdValues);
            }
        }

    rootNode.children.forEach(collectIdValues);

    return thisNodeIdValues;
}

function translateAnnealNodeToStratumNode(node: AnnealNode.Node): AnnealStratumNodeStub {
    // For leaf nodes with records, we set the size to the number of record IDs
    // that are associated with that node
    if (node.type === "stratum-records") {
        const stub = new AnnealStratumNodeStub(node._id);
        stub.setSize(node.recordIds.length);
        return stub;
    }

    return new AnnealStratumNodeStub(node._id, node.children.map(translateAnnealNodeToStratumNode));
}

function calculateStratumNodeStubSize(stubNode: AnnealStratumNodeStub): number {
    const children = stubNode.getChildren();

    // If no children, we have a leaf with records attached
    if (children === undefined) {
        const size = stubNode.getSize();

        if (size === undefined) {
            throw new Error("No size set on leaf stratum node");
        }

        // Return the number of records
        return size;
    }

    const totalSize = children.reduce((carry, child) => carry + calculateStratumNodeStubSize(child), 0);

    return stubNode.setSize(totalSize);
}

function generateStratumNodes(buffer: ArrayBuffer, nodesPerStratum: ReadonlyArray<AnnealStratumNode[]>, stubNode: AnnealStratumNodeStub, stratumNumber: number, offset: number) {
    const children = stubNode.getChildren();

    // Terminal case when no children are present
    if (children === undefined) {
        return;
    }

    // Copy out working copy of offset for the children loop
    let workingOffset = offset;

    children.forEach((childStubNode) => {
        const size = childStubNode.getSize()!;

        // Generate stratum node and push into array
        const stratumNode = new AnnealStratumNode(stubNode.getId(), buffer, workingOffset, size);
        nodesPerStratum[stratumNumber].push(stratumNode);

        // Recurse down
        //
        // Note that stratum number value goes down because strata are arranged 
        // [lowest, ..., highest] while we're recursing down a tree in
        // [highest, ..., lowest] order;
        generateStratumNodes(buffer, nodesPerStratum, childStubNode, stratumNumber - 1, workingOffset);

        // Update offset for next child
        workingOffset += size;
    });
}

/**
 * Derives starting temperature.
 */
function deriveStartingTemperature(recordPointers: AnnealRecordPointerArray, strata: ReadonlyArray<AnnealStratum>) {
    // TODO: Make `tempDerSamples` and `maximumLoopIterations` configurable in 
    // TA-79
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




// /**
//  * Creates nested arrays that represent the strata structure
//  * 
//  * e.g.:
//  * 
//  *      [                            // All top level nodes
//  *          [                        // Stratum 1 node
//  *              [                    // Stratum 0 node
//  *                  [record data],
//  *                  [record data],
//  *                  [record data],
//  *                  [record data]
//  *              ],
//  *              [                    // Stratum 0 node
//  *                  [record data],
//  *                  [record data],
//  *                  [record data],
//  *                  [record data]
//  *              ]
//  *          ],
//  *          ...
//  *      ]
//  */
// function convertStrataToArray(strata: ReadonlyArray<AnnealStratum>, records: Record.RecordSet) {
//     // TODO: Need to better describe nested arrays of unknown depth
//     type UnknownDepthNestedArray = any[];

//     const numberOfStrata = strata.length;

//     // Nothing to process if there aren't strata
//     if (numberOfStrata < 1) {
//         return [];
//     }

//     // Map out the lowest stratum first
//     const lowestStratumArray = strata[0].nodes.map(
//         (node) => {
//             const recordDataArray: Record.Record[] = [];

//             node.getRecordPointers().forEach((recordPointer) => {
//                 const recordData = records[recordPointer];
//                 recordDataArray.push(recordData);
//             });

//             return recordDataArray;
//         }
//     );

//     // We now go up strata one by one and nest the previous stratum's nodes
//     let previousStratumArray: UnknownDepthNestedArray = lowestStratumArray;

//     for (let i = 1; i < numberOfStrata; ++i) {
//         const previousStratumNodes = strata[i - 1].nodes;
//         const thisStratumNodes = strata[i].nodes;

//         const currentStratumArray: UnknownDepthNestedArray = [];

//         // Go through each of this stratum's nodes, and bundle up previous 
//         // stratum nodes
//         let previousStratumNodeIndex = 0;

//         for (let j = 0; j < thisStratumNodes.length; ++j) {
//             const thisStratumNode = thisStratumNodes[j];
//             const thisStratumNodeDataArray: UnknownDepthNestedArray = [];

//             while (true) {
//                 const previousStratumNode: AnnealStratumNode | undefined = previousStratumNodes[previousStratumNodeIndex];

//                 // If we get `undefined`, we have hit the end; or
//                 // if we hit substratum nodes which are no longer within
//                 // this stratum node's range, we move on to the next node
//                 if ((previousStratumNode === undefined) || !thisStratumNode.isNodeInRange(previousStratumNode)) {
//                     break;
//                 }

//                 // If the previous stratum node being pointed to falls under
//                 // the current stratum node, we push in the array that is held
//                 // in `previousStratumArray`
//                 thisStratumNodeDataArray.push(previousStratumArray[previousStratumNodeIndex]);

//                 // Move on to the next substratum node
//                 ++previousStratumNodeIndex;
//             }

//             // Push in this stratum node's array of substrata data arrays
//             currentStratumArray.push(thisStratumNodeDataArray);
//         }

//         // We have now finished with all of this stratum's nodes;
//         // prepare for next stratum iteration
//         previousStratumArray = currentStratumArray;
//     }

//     // The output is the array last set by the top stratum:
//     //      `previousStratumArray` points to the `currentStratumArray` at the
//     //      end of the last iteration
//     return previousStratumArray;
// }

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

// function createStrataObjects(recordPointers: AnnealRecordPointerArray, constraints: ReadonlyArray<AbstractConstraint>, strataDefs: ReadonlyArray<Stratum.Desc>): ReadonlyArray<AnnealStratum> {
//     // Go through each stratum and create nodes that refer to views on record
//     // pointers in the record store
//     const strata: AnnealStratum[] = [];
//     const numberOfRecords = recordPointers.numberOfRecords;

//     for (let stratumIndex = 0; stratumIndex < strataDefs.length; ++stratumIndex) {
//         const stratumDef = strataDefs[stratumIndex];
//         const { min, ideal, max } = stratumDef.size;

//         // For the lowest stratum, we take records directly from the store,
//         // otherwise we take the previous stratum we generated and directly init
//         // a node from that
//         let nodes: AnnealStratumNode[];

//         if (stratumIndex === 0) {
//             const buffer = recordPointers.workingSet.buffer;
//             const groupSizeArray = GroupDistribution.generateGroupSizes(numberOfRecords, min, ideal, max, false);

//             let offset: number = 0;

//             nodes = groupSizeArray.map((groupSize) => {
//                 const currentOffset = offset;

//                 // Update `offset` of next round
//                 offset += groupSize;

//                 // Init new node
//                 return new AnnealStratumNode(buffer, currentOffset, groupSize);
//             });
//         } else {
//             const prevStratumNodes = strata[stratumIndex - 1].nodes;
//             const numberOfPrevStratumNodes = prevStratumNodes.length;

//             const groupSizeArray = GroupDistribution.generateGroupSizes(numberOfPrevStratumNodes, min, ideal, max, false);

//             let offset: number = 0;

//             nodes = groupSizeArray.map((groupSize) => {
//                 const currentOffset = offset;

//                 // Update `offset` of next round
//                 offset += groupSize;

//                 // Init new node
//                 return AnnealStratumNode.initFromChildren(prevStratumNodes.slice(currentOffset, currentOffset + groupSize));
//             });
//         }

//         const stratumConstraints = constraints.filter(constraint => constraint.constraintDef.strata === stratumIndex);

//         strata.push(new AnnealStratum(nodes, stratumConstraints));
//     }

//     return strata;
// }

function generateSatisfactionArray(constraints: ReadonlyArray<AbstractConstraint>, strata: ReadonlyArray<AnnealStratum>): ReadonlyArray<ReadonlyArray<ReadonlyArray<number | undefined>>> {
    const satisfaction =
        strata.map((stratum) => {                       // For each stratum,
            const stratumId = stratum.id;
            return stratum.nodes.map(node => {          // and for each node in that stratum,
                return constraints.map(constraint => {  // go through all constraints

                    // If this constraint does not apply to the stratum, return
                    // undefined
                    if (constraint.constraintDef.stratum !== stratumId) {
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
    // TODO: Make parameters configurable in TA-79
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
