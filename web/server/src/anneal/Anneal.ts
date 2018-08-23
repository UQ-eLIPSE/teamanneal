// Interfaces
import * as Stratum from "../../../common/Stratum";
import * as RecordData from "../../../common/RecordData";
import * as Constraint from "../../../common/Constraint";
import * as AnnealNode from "../../../common/AnnealNode";

// Data manipulation and structures
import * as ColumnInfo from "../data/ColumnInfo";
import * as Data_Constraint from "../data/Constraint";
import * as Data_RecordData from "../data/RecordData";
import * as Data_AnnealNode from "../data/AnnealNode";
import { AnnealStratum } from "../data/AnnealStratum";
import { AnnealRecordPointerArray } from "../data/AnnealRecordPointerArray";
// import * as Random from "../data/Random";

// Anneal-related
import * as CostCompute from "./CostCompute";
import * as MutationOperation from "./MutationOperation";
import * as Iteration from "./Iteration";
import * as UphillTracker from "./UphillTracker";
import * as StartingTemperature from "./StartingTemperature";
import * as ConstraintSatisfaction from "./ConstraintSatisfaction";
import { Config } from "../utils/Config";

export function setupAnnealVariables(annealRootNode: AnnealNode.NodeRoot, recordData: RecordData.Desc, strataDefinitions: ReadonlyArray<Stratum.Desc>, constraintDefinitions: ReadonlyArray<Constraint.Desc>) {
    /// ==================
    /// Processing records
    /// ==================

    const { records: globalRecordSet, columns } = recordData;

    // Generate column information objects
    //
    // Note that this uses information from the WHOLE set of records, not just
    // filtered records
    const columnInfos = columns.map((column, i) => ColumnInfo.initFromColumnIndex(globalRecordSet, i, column));

    // Find the ID column
    const idColumnIndex = ColumnInfo.getIdColumnIndex(columns);

    // Filter records so that we are only working with records for this anneal 
    // node
    const records = Data_AnnealNode.filterRecords(annealRootNode, idColumnIndex, globalRecordSet);

    // Extract ID values from each record
    const recordsIdColumn = Data_RecordData.extractDataFromColumn(records, idColumnIndex);

    /// =======================
    /// Configuring constraints
    /// =======================

    const constraints = constraintDefinitions.map(c => Data_Constraint.init(records, columnInfos, c));

    /// =====================================================
    /// Processing nodes, creating record pointers and strata
    /// =====================================================

    // Create set of strata objects
    const { strata, recordPointers, annealNodeToStratumNodeMap } =
        AnnealStratum.createStrataSet(constraints, strataDefinitions, recordsIdColumn, annealRootNode);

    return {
        /** Columns in the given data */
        columns,
        /** Column information objects */
        columnInfos,
        /** Index of the ID column */
        idColumnIndex,

        /** Records for this given root node */
        records,
        /** Just the ID column values from records for this given root node */
        recordsIdColumn,

        /** Constraints in the given data */
        constraints,

        /** Strata array in the order: [lowest (leaf), ..., highest] */
        strata,
        recordPointers,
        annealNodeToStratumNodeMap,
    };
}

export function anneal(annealRootNode: AnnealNode.NodeRoot, recordData: RecordData.Desc, strataDefinitions: ReadonlyArray<Stratum.Desc>, constraintDefinitions: ReadonlyArray<Constraint.Desc>) {
    // Fix random seed for debugging
    // Random.setGlobalSeed(0xDEADBEEF);

    // Check that constraints array is not empty
    if (constraintDefinitions.length === 0) {
        throw new Error("Constraints array is empty; aborting anneal");
    }

    // Setup anneal variables
    const {
        recordsIdColumn,
        constraints,
        strata,
        recordPointers,
        annealNodeToStratumNodeMap,
    } = setupAnnealVariables(annealRootNode, recordData, strataDefinitions, constraintDefinitions);

    /// =======================
    /// Calculating temperature
    /// =======================

    console.log("Deriving temperature...");
    const startTemp = StartingTemperature.derive(recordPointers, strata);

    /// ====================
    /// Loop over iterations
    /// ====================

    console.log("Iterating...");
    annealMainLoop(recordPointers, strata, startTemp);

    console.log("Anneal complete");

    /// ===============
    /// Generate output
    /// ===============

    const output = {
        tree: Data_AnnealNode.generateTree(recordsIdColumn, annealNodeToStratumNodeMap, annealRootNode) as AnnealNode.NodeRoot,
        satisfaction: ConstraintSatisfaction.generateMap(constraints, strata),
    };

    return output;
}

function annealMainLoop(recordPointers: AnnealRecordPointerArray, strata: ReadonlyArray<AnnealStratum>, startTemp: number) {
    const annealConfig = Config.get().anneal;
    const defaultBranchIterationScalar: number = annealConfig.mainLoop.defaultNumberOfBranchIterations;
    const defaultAvgUphillProbabilityThreshold: number = annealConfig.mainLoop.avgUphillProbabilityThreshold;

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
        /// annealBranchLoop (one branch)
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
