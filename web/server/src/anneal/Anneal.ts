import * as Logger from "../core/Logger";
import * as Util from "../core/Util";

// Interfaces
import * as SourceData from "../../../common/SourceData";
import * as Strata from "../../../common/Strata";
import * as Constraint from "../../../common/Constraint";

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

const globalLogger = Logger.getGlobal();
const log = Logger.log(globalLogger);

export function anneal(sourceData: SourceData.DescBase & SourceData.Partitioned, strata: ReadonlyArray<Strata.Desc>, constraints: ReadonlyArray<Constraint.Desc>) {
    const partitions = sourceData.records;

    // An array of all records in the data set
    const allRecords = Util.concatArrays(partitions);

    /// =========================
    /// Gather column information
    /// =========================

    const columnInfos = sourceData.columns.map((column, i) => {
        return ColumnInfo.initFromColumnIndex(allRecords, i, column);
    });



    /// =====================
    /// Parallelisable anneal
    /// =====================

    // Operate per partition (isolated data sets - can be parallelised)
    log("info")(`Starting anneal`);
    const output = partitions.map((partition, i) => {
        log("info")(`Annealing partition ${i + 1}`);

        /// ================================
        /// Structuring the data into a tree
        /// ================================

        // Convert all records into AnnealNodes
        // Records are leaves for our AnnealNode tree
        const leaves = partition.map(AnnealNode.init);

        // Shuffle all leaves now
        // This only needs to be done once - there is no advantage in
        // shuffling nodes higher up in the tree
        let nodes = Util.shuffleArray(leaves);

        // Hold references to each node created per stratum
        const strataNodes: ReadonlyArray<AnnealNode.AnnealNode>[] = [];

        // Go over each stratum
        strata.forEach((stratum) => {
            // Calculate number of groups to form
            const numberOfGroups = GroupDistribution.calculateNumberOfGroups(nodes.length, stratum.size.min, stratum.size.ideal, stratum.size.max, false);

            // Splice into groups
            const groups = GroupDistribution.sliceIntoGroups(numberOfGroups, nodes);

            // Create new nodes for this stratum from new groups above
            const thisStratumNodes = groups.map(AnnealNode.createNodeFromChildrenArray);

            // Build up arrays of AnnealNode that are represented at each
            // stratum
            strataNodes.push(thisStratumNodes);

            // Build up AnnealNode tree by updating `nodes` to refer to the
            // array of nodes from this stratum; this is reused on next loop
            nodes = thisStratumNodes;
        });

        // Create root node
        const rootNode = AnnealNode.createNodeFromChildrenArray(nodes);



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








        /// =====
        /// Costs
        /// =====

        // Constant 0 cost object for leaves
        const leafCost = CostCache.init(0);









        /// =======================
        /// Calculating temperature
        /// =======================

        log("info")("Calculating temperature...");

        const tempDerSamples = 200;

        // Temperature derivation object
        const tempDer = TemperatureDerivation.init(tempDerSamples);

        // Preserve the initial state
        const startState = AnnealNode.exportState(rootNode);

        // Running cost for temperature derivation process
        let tempDerCurrentCost: number | undefined = undefined;

        while (!TemperatureDerivation.isReadyForDerivation(tempDer)) {
            // NOTE: We do not care about resetting state on every loop;
            // this is the same for the original TeamAnneal code as it
            // continuously runs moves without regard for restoring the
            // previous/original state

            // Invalidate cost cache, reinit leaves
            CostCache.invalidateAll();
            leaves.forEach(leaf => CostCache.insert(leaf, leafCost));

            // Go through strata, bottom up
            for (let j = 0; j < strata.length; ++j) {
                const nodes = strataNodes[j];
                const constraints = strataConstraints[j];

                // Perform random op
                const operation = MutationOperation.randPick();
                operation(nodes);

                CostCompute.computeAndCacheStrataCost(leaves, constraints, columnInfos, nodes);
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

        const startTemp = TemperatureDerivation.deriveTemperature(tempDer);


        /// ====================
        /// Loop over iterations
        /// ====================

        log("info")("Iterating...");

        const defaultStepIterationScalar: number = 4;
        const defaultAvgUphillProbabilityThreshold: number = 0.0025;

        // Reset state, invalidate cost cache, reinit leaves
        AnnealNode.importState(rootNode, startState);
        CostCache.invalidateAll();
        leaves.forEach(leaf => CostCache.insert(leaf, leafCost));

        let $ = Number.POSITIVE_INFINITY;   // cost
        let T = startTemp;                  // temperature

        let itScalar = defaultStepIterationScalar;

        const uphillTracker = UphillTracker.init();







        let COUNTER = 0;

        while (true) {







            // Run iterations as determined by `itScalar` and number of
            // records (leaves)
            const numberOfIterations = itScalar * leaves.length;

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
                leaves.forEach(leaf => CostCache.insert(leaf, leafCost));

                // Calculate total cost
                strataConstraints.forEach((constraints) => {
                    // Calculate costs for strata nodes
                    CostCompute.computeAndCacheStrataCost(leaves, constraints, columnInfos, nodes);
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
            }







            // Update temperature
            T = Iteration.calculateNewTemperature(T);

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




            if (++COUNTER % 1000 === 0) {
                log("info")(`Counter = ${COUNTER}`);
            }
        }

        // TODO: Actually output something
        return true;
    });

    log("info")(`Finished anneal`);

    return output;
}
