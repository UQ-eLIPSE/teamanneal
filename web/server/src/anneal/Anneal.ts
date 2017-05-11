import * as Logger from "../core/Logger";
import * as Util from "../core/Util";

// Interfaces
import * as SourceData from "../../../common/SourceData";
import * as Stratum from "../../../common/Stratum";
import * as Constraint from "../../../common/Constraint";
import * as Record from "../../../common/Record";

// Data manipulation and structures
import * as AnnealNode from "../data/AnnealNode";
import * as GroupDistribution from "../data/GroupDistribution";
import * as ColumnInfo from "../data/ColumnInfo";
import * as CostCache from "../data/CostCache";

// Anneal-related
import * as ProcessedConstraint from "./ProcessedConstraint";
import * as CostCompute from "./CostCompute";
import * as MutationOperation from "./MutationOperation";
import * as Iteration from "./Iteration";
import * as UphillTracker from "./UphillTracker";
import * as TemperatureDerivation from "./TemperatureDerivation";
import * as ConstraintSatisfaction from "./ConstraintSatisfaction";

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

function annealPartition(partition: Record.RecordSet, columnInfos: ReadonlyArray<ColumnInfo.ColumnInfo>, strata: ReadonlyArray<Stratum.Desc>, constraints: ReadonlyArray<Constraint.Desc>) {
    /// ================================
    /// Structuring the data into a tree
    /// ================================

    // Convert all records into AnnealNodes
    // Records are leaves for our AnnealNode tree
    const leaves = partition.map(AnnealNode.init);

    // Get root node and nodes for each strata
    const { strataNodes, rootNode } = createTree(leaves, strata);



    /// =======================
    /// Configuring constraints
    /// =======================

    const processedConstraints = constraints.map(ProcessedConstraint.init);

    const strataConstraints = strata.map((_stratum, stratumIndex) => {
        const stratumConstraints: ProcessedConstraint.ProcessedConstraint[] = [];

        processedConstraints.forEach((appliedConstraint) => {
            if (appliedConstraint.constraint.strata === stratumIndex) {
                stratumConstraints.push(appliedConstraint);
            }
        });

        return stratumConstraints;
    });



    /// =======================
    /// Calculating temperature
    /// =======================

    const startTemp = deriveStartingTemperature(rootNode, leaves, columnInfos, strata, strataNodes, strataConstraints);



    /// ====================
    /// Loop over iterations
    /// ====================

    log("info")("Iterating...");

    const defaultStepIterationScalar: number = 4;
    const defaultAvgUphillProbabilityThreshold: number = 0.0025;

    // Track uphill probabilities
    const uphillTracker = UphillTracker.init();

    // Running numbers
    let $ = Number.POSITIVE_INFINITY;   // cost
    let T = startTemp;                  // temperature

    // Iteration scalar adjusts the number of mutation trials
    let itScalar = defaultStepIterationScalar;

    while (true) {
        // Run iterations as determined by `itScalar` and number of
        // records (leaves)
        const numberOfIterations = itScalar * leaves.length;







        /// ====================================================================
        /// anneal_inner_loop
        /// ====================================================================
        {
            // Keep track of cost and state before we started running iterations
            const previousCost = $;
            const previousState = AnnealNode.exportState(rootNode);

            // Reset uphill accept/reject
            UphillTracker.resetAcceptReject(uphillTracker);

            // Iterate!
            for (let j = 0; j < numberOfIterations; ++j) {
                log("debug")(`Iteration ${j}`);

                // Take tree state snapshot now
                const stateSnapshot = AnnealNode.exportState(rootNode);

                // Go through strata, bottom up
                strataNodes.forEach((nodes) => {
                    // Perform random op
                    const operation = MutationOperation.randPick();
                    operation(nodes);
                });

                // Invalidate cost cache, reinit leaves
                // TODO: Leverage the fact that we have cached costs to reduce
                // the number of cost recalculations
                CostCache.invalidateAll();
                leaves.forEach(leaf => CostCache.insert(leaf, 0));

                // Calculate total cost
                strataConstraints.forEach((constraints, k) => {
                    // Calculate costs for strata nodes
                    CostCompute.computeAndCacheStratumCost(leaves, constraints, columnInfos, strataNodes[k]);
                });

                const newCost = CostCompute.sumChildrenCost(rootNode);
                const deltaCost = Iteration.calculateCostDifference($, newCost);

                // Determine if this iteration is accepted
                const iterationAccepted = Iteration.isNewCostAcceptable(T, $, newCost);

                if (iterationAccepted) {
                    // Update cost
                    $ = newCost;
                } else {
                    // Restore previous state
                    AnnealNode.importState(rootNode, stateSnapshot);
                }

                // Update uphill tracker
                if (deltaCost > 0) {
                    if (iterationAccepted) {
                        UphillTracker.incrementAccept(uphillTracker);
                    } else {
                        UphillTracker.incrementReject(uphillTracker);
                    }
                }

                // Update temperature
                T = Iteration.calculateNewTemperature(T);

            }

            // Restore previous state if cost before this set of iterations
            // was better
            if (previousCost < $) {
                $ = previousCost;
                AnnealNode.importState(rootNode, previousState);
            }
        }







        // Tweak iteration scalar depending on uphill probability
        const uphillAcceptanceProbability = UphillTracker.getAcceptanceProbability(uphillTracker);

        if (uphillAcceptanceProbability > 0.7 || uphillAcceptanceProbability < 0.2) {
            itScalar = 4;
        } else if (uphillAcceptanceProbability > 0.6 || uphillAcceptanceProbability < 0.3) {
            itScalar = 8;
        } else {
            itScalar = 32;
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
    const satisfaction = strataNodes.map(stratumNodes => {
        return stratumNodes.map(node => {
            return processedConstraints.map(processedConstraint => {
                return ConstraintSatisfaction.calculateSatisfaction(columnInfos, processedConstraint, node, leaves)
            });
        });
    });

    log("info")(`Satisfaction`, satisfaction);

    return convertNodeToArray(rootNode, strata.length);
}

/**
 * Creates AnnealNode tree/doubly-linked-list structure.
 */
function createTree(leaves: ReadonlyArray<AnnealNode.AnnealNode>, strata: ReadonlyArray<Stratum.Desc>) {
    // Shuffle all leaves now
    // This only needs to be done once - there is no advantage in
    // shuffling nodes higher up in the tree
    let nodes = Util.shuffleArray(leaves);

    // Hold references to each node created per stratum
    const strataNodes: ReadonlyArray<AnnealNode.AnnealNode>[] = [];

    // Go over each stratum
    strata.forEach((stratum) => {
        const numberOfGroups = GroupDistribution.calculateNumberOfGroups(nodes.length, stratum.size.min, stratum.size.ideal, stratum.size.max, false);
        const groups = GroupDistribution.sliceIntoGroups(numberOfGroups, nodes);

        // Create new nodes for this stratum from new groups above
        const thisStratumNodes = groups.map((group) => AnnealNode.createNodeFromChildrenArray(group, undefined));

        // Build up arrays of AnnealNode that are represented at each
        // stratum
        strataNodes.push(thisStratumNodes);

        // Build up AnnealNode tree by updating `nodes` to refer to the
        // array of nodes from this stratum; this is reused on next loop
        nodes = thisStratumNodes;
    });

    // Create root node
    const rootNode = AnnealNode.createNodeFromChildrenArray(nodes, undefined);

    return {
        strataNodes,    // Array of nodes for each stratum
        rootNode,       // Root node of tree
    }
}

/**
 * Derives starting temperature.
 */
function deriveStartingTemperature(rootNode: AnnealNode.AnnealNode, leaves: ReadonlyArray<AnnealNode.AnnealNode>, columnInfos: ReadonlyArray<ColumnInfo.ColumnInfo>, strata: ReadonlyArray<Stratum.Desc>, strataNodes: ReadonlyArray<ReadonlyArray<AnnealNode.AnnealNode>>, strataConstraints: ReadonlyArray<ReadonlyArray<ProcessedConstraint.ProcessedConstraint>>) {
    const tempDerSamples = 200;

    // Preserve the initial state
    const startState = AnnealNode.exportState(rootNode);

    // Temperature derivation object
    const tempDer = TemperatureDerivation.init(tempDerSamples);

    // Running cost for temperature derivation process
    let tempDerCurrentCost: number | undefined = undefined;

    while (!TemperatureDerivation.isReadyForDerivation(tempDer)) {
        // NOTE: We do not care about resetting state on every loop;
        // this is the same for the original TeamAnneal code as it
        // continuously runs moves without regard for restoring the
        // previous/original state

        // Invalidate cost cache, reinit leaves
        CostCache.invalidateAll();
        leaves.forEach(leaf => CostCache.insert(leaf, 0));

        // Go through strata, bottom up
        for (let j = 0; j < strata.length; ++j) {
            const nodes = strataNodes[j];
            const constraints = strataConstraints[j];

            // Perform random op
            const operation = MutationOperation.randPick();
            operation(nodes);

            CostCompute.computeAndCacheStratumCost(leaves, constraints, columnInfos, nodes);
        }

        // Calculate cost
        const newCost = CostCompute.sumChildrenCost(rootNode);

        // Assign cost at start
        if (tempDerCurrentCost === undefined) {
            tempDerCurrentCost = newCost;
        }

        // Only accumulate uphill cost differences to the temperature
        // derivation object
        const costDiff = Iteration.calculateCostDifference(tempDerCurrentCost, newCost);

        if (costDiff > 0) {
            TemperatureDerivation.pushCostDelta(tempDer, costDiff);
        }
    }

    // Derive the starting temperature
    const startTemp = TemperatureDerivation.deriveTemperature(tempDer);

    // Restore root node to original state before we exit
    AnnealNode.importState(rootNode, startState);

    return startTemp;
}

/**
 * Converts AnnealNode tree into nested arrays of records for export/output to
 * client.
 */
function convertNodeToArray(node: AnnealNode.AnnealNode, remainingSubstrata: number) {
    // TODO: Need to better describe nested arrays of unknown depth
    const output: any[] = [];

    // If we hit the bottom stratum (the one above the leaves), return array of
    // children data
    if (remainingSubstrata === 0) {
        AnnealNode.forEachChild(node, (child) => {
            output.push(child.data);
        });
    } else {
        AnnealNode.forEachChild(node, (child) => {
            output.push(convertNodeToArray(child, remainingSubstrata - 1));
        });
    }

    return output;
}
