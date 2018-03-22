// Interfaces
import * as Record from "../../../common/Record";
import * as Stratum from "../../../common/Stratum";
import * as RecordData from "../../../common/RecordData";
import * as Constraint from "../../../common/Constraint";
import * as AnnealNode from "../../../common/AnnealNode";
import { NodeSatisfactionObject, SatisfactionMap } from "../../../common/ConstraintSatisfaction";

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
// import { AnnealStratumNodeStub } from "./AnnealStratumNodeStub";

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

    // Extract ID values from each record
    const thisNodeRecordsIdColumn = thisNodeRecords.map(record => record[idColumnIndex]);



    /// =======================
    /// Configuring constraints
    /// =======================

    console.log("Creating constraint obj...");
    const constraints = createConstraintObjects(thisNodeRecords, columnInfos, constraintDefinitions);



    /// =====================================================
    /// Processing nodes, creating record pointers and strata
    /// =====================================================

    // Maps node to a number which represents the total number of records that
    // sit under it
    const nodeSizeMap = new WeakMap<AnnealNode.Node, number>();

    // Maps node to respective stratum node
    const annealNodeToStratumNodeMap = new WeakMap<AnnealNode.Node, AnnealStratumNode>();

    // Run through all nodes to calculate their sizes
    const numberOfRecordsInStubs = calculateAnnealNodeSizes(nodeSizeMap, annealRootNode);

    // Quick sanity check to make sure that we do indeed have the correct number
    // of records in stub tree
    if (numberOfRecordsInStubs !== thisNodeRecords.length) {
        throw new Error("Number of records in stratum node stubs do not match length of filtered records");
    }

    // Store stratum nodes into linear array where each element is one "level";
    // - index 0 is the lowest level = leaf nodes containing the records,
    // - index (end) is the highest level
    const nodesPerStratum: AnnealStratumNode[][] = [];

    // Prepopulate blank strata node arrays
    for (let i = 0; i < strataDefinitions.length; ++i) {
        nodesPerStratum.push([]);
    }

    // Create record pointer array
    console.log("Creating record pointers...");
    const recordPointers = new AnnealRecordPointerArray(thisNodeRecords.length);

    // Function does three things:
    // - Generate the stratum nodes,
    // - Set stratum nodes into the node to stratum node map,
    // - Sets record pointers into record pointer array
    generateStratumNodes(recordPointers.workingSet, thisNodeRecordsIdColumn, nodeSizeMap, annealNodeToStratumNodeMap, nodesPerStratum, annealRootNode, strataDefinitions.length - 1, 0);

    // Bundle the stratum nodes into AnnealStratum objects
    console.log("Bundling stratum nodes into strata...");

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



    /// ===============
    /// Generate output
    /// ===============

    const output = {
        tree: generateOutputTree(thisNodeRecords, idColumnIndex, annealNodeToStratumNodeMap, annealRootNode) as AnnealNode.NodeRoot,
        satisfaction: generateSatisfactionMap(constraints, strata),
    };

    return output;
}

/**
 * Filters records down to those which actually sit under the given root node.
 * 
 * @param rootNode Root node
 * @param idColumnIndex Index of the ID column in each record row
 * @param records Set of records
 */
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

/**
 * Extracts all record IDs that are described leaf nodes. May contain duplicate
 * record IDs if the nodes don't uniquely specify IDs.
 * 
 * @param rootNode Root node
 */
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

/**
 * Calculates size of anneal nodes given and all child nodes. Sets this
 * information into supplied size map.
 * 
 * @param sizeMap Map of anneal node to number (size)
 * @param node Node to calculate size on
 */
function calculateAnnealNodeSizes(sizeMap: WeakMap<AnnealNode.Node, number>, node: AnnealNode.Node): number {
    // For the leaf nodes with records attached to them, return the number of records
    if (node.type === "stratum-records") {
        const size = node.recordIds.length;
        sizeMap.set(node, size);
        return size;
    }

    // For general nodes with children, sum up the sizes of all children
    const children = node.children;
    const totalSize = children.reduce((carry, child) => carry + calculateAnnealNodeSizes(sizeMap, child), 0);
    sizeMap.set(node, totalSize);

    return totalSize;
}

/**
 * Function does three things:
 * - Generate the stratum nodes,
 * - Set stratum nodes into the node to stratum node map,
 * - Sets record pointers into record pointer array.
 * 
 * You must supply an empty map for `sizeMap`, `annealNodeToStratumNodeMap`, and
 * empty nested arrays for `nodesPerStratum`.
 * 
 * @param pointerArrayWorkingSet The working set Uint32Array typed array
 * @param recordIdColumn Array with just the ID values of the records, in the order that the records appear
 * @param sizeMap Map between node and its size (will be filled after running this function)
 * @param annealNodeToStratumNodeMap Map between anneal node (from the request) to stratum node (used internally in the anneal) (will be filled after running this function)
 * @param nodesPerStratum Array holding the stratum nodes per stratum (will be filled after running this function)
 * @param node The node being operated on
 * @param stratumNumber The stratum number of the node being operated on
 * @param offset The pointer array offset being kept track of
 */
function generateStratumNodes(pointerArrayWorkingSet: Uint32Array, recordIdColumn: ReadonlyArray<Record.RecordElement>, sizeMap: WeakMap<AnnealNode.Node, number>, annealNodeToStratumNodeMap: WeakMap<AnnealNode.Node, AnnealStratumNode>, nodesPerStratum: ReadonlyArray<AnnealStratumNode[]>, node: AnnealNode.Node, stratumNumber: number, offset: number) {
    // Terminal case when no children are present
    if (node.type === "stratum-records") {
        // Convert records to their respective pointer values
        const recordPointers =
            node.recordIds.map((recordId) => {
                // Pointer value is just the index of this particular record in
                // the larger set of records
                const pointerValue = recordIdColumn.indexOf(recordId);

                if (pointerValue < 0) {
                    throw new Error(`Could not find node child record ID "${recordId}" in provided record ID column array`);
                }

                return pointerValue;
            });

        // Write the pointers for the above records into pointer array at offset
        pointerArrayWorkingSet.set(recordPointers, offset);

        return;
    }

    // Copy out working copy of offset for the children loop
    let workingOffset = offset;

    const children = node.children;

    children.forEach((childNode) => {
        // Get the precalculated sizes of each node from the given map
        const size = sizeMap.get(childNode);

        if (size === undefined) {
            throw new Error("Node size not found in precalculated map");
        }

        // Generate stratum node, put into map, and push into array
        const stratumNode = new AnnealStratumNode(childNode._id, pointerArrayWorkingSet.buffer, workingOffset, size);
        annealNodeToStratumNodeMap.set(childNode, stratumNode);
        nodesPerStratum[stratumNumber].push(stratumNode);

        // Recurse down
        //
        // Note that stratum number value goes down because strata are arranged 
        // [lowest, ..., highest] while we're recursing down a tree in
        // [highest, ..., lowest] order;
        generateStratumNodes(pointerArrayWorkingSet, recordIdColumn, sizeMap, annealNodeToStratumNodeMap, nodesPerStratum, childNode, stratumNumber - 1, workingOffset);

        // Update offset for next child
        workingOffset += size;
    });
}

/**
 * Generates output tree to send back to client.
 * 
 * @param records Array of records
 * @param idColumnIndex Column index of record with ID values
 * @param annealNodeToStratumNodeMap Map between anneal node (from the request) to stratum node (used internally in the anneal)
 * @param node The node being operated on
 */
function generateOutputTree(records: Record.RecordSet, idColumnIndex: number, annealNodeToStratumNodeMap: WeakMap<AnnealNode.Node, AnnealStratumNode>, node: AnnealNode.Node): AnnealNode.Node {
    // Output full records for leaf nodes
    if (node.type === "stratum-records") {
        const stratumNode = annealNodeToStratumNodeMap.get(node);

        if (stratumNode === undefined) {
            throw new Error(`Could not find stratum node for anneal node ${node._id}`);
        }

        const recordPointers = Array.from(stratumNode.getRecordPointers());

        const outputNode: AnnealNode.NodeStratumWithRecordChildren = {
            _id: node._id,
            type: node.type,
            stratum: node.stratum,
            recordIds: recordPointers.map(pointer => records[pointer][idColumnIndex]),
        };

        return outputNode;
    }

    // Map stratum-stratum nodes
    if (node.type === "stratum-stratum") {
        const outputNode: AnnealNode.NodeStratumWithStratumChildren = {
            _id: node._id,
            type: node.type,
            stratum: node.stratum,
            children: node.children.map(childNode => generateOutputTree(records, idColumnIndex, annealNodeToStratumNodeMap, childNode) as AnnealNode.NodeStratumWithStratumChildren | AnnealNode.NodeStratumWithRecordChildren),
        };

        return outputNode;
    }

    // Map root nodes
    if (node.type === "root") {
        const outputNode: AnnealNode.NodeRoot = {
            _id: node._id,
            type: node.type,
            partitionValue: node.partitionValue,
            children: node.children.map(childNode => generateOutputTree(records, idColumnIndex, annealNodeToStratumNodeMap, childNode) as AnnealNode.NodeStratumWithStratumChildren),
        };

        return outputNode;
    }

    throw new Error("Unknown node type");
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

function generateStratumSatisfactionMap(constraints: ReadonlyArray<AbstractConstraint>, stratum: AnnealStratum) {
    // We only work with constraints that actually apply to this stratum
    const applicableConstraints = constraints.filter(c => c.constraintDef.stratum === stratum.id);

    // Collect up all node satisfaction objects into one large lookup map
    return stratum.nodes.reduce<SatisfactionMap>((satisfactionMap, node) => {
        const nodeId = node.getId();

        // Collect up all constraint satisfaction for this node in an object
        satisfactionMap[nodeId] = applicableConstraints.reduce<NodeSatisfactionObject>((nodeSatisfactionObject, constraint) => {
            return Object.assign(nodeSatisfactionObject, ConstraintSatisfaction.calculateSatisfaction(constraint, node));
        }, {});

        return satisfactionMap;
    }, {});
}

function generateSatisfactionMap(constraints: ReadonlyArray<AbstractConstraint>, strata: ReadonlyArray<AnnealStratum>) {
    // Generate satisfaction map of all stratum nodes combined into one
    return strata
        .map(stratum => generateStratumSatisfactionMap(constraints, stratum))
        .reduce((carry, stratumSatisfactionMap) => Object.assign(carry, stratumSatisfactionMap), {});
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
