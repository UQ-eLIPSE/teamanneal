import { Store, GetterTree } from "vuex";
import { AnnealCreatorState as State } from "./state";

import * as Partition from "../../data/Partition";
import * as StratumSize from "../../data/StratumSize";
import * as AnnealRequestState from "../../data/AnnealRequestState";

type GetterFunction<G extends AnnealCreatorGetter> = typeof getters[G];

export enum AnnealCreatorGetter {
    HAS_SOURCE_FILE_DATA = "Has source file data",
    HAS_VALID_ID_COLUMN_INDEX = "Has a valid ID column index defined",
    HAS_DUPLICATE_COLUMN_NAMES = "Has duplicate column names",
    HAS_STRATA = "Has strata defined",
    HAS_CONSTRAINTS = "Has constraints defined",
    IS_STRATA_CONFIG_NAMES_VALID = "Is strata config names valid",
    IS_STRATA_CONFIG_SIZES_VALID = "Is strata config sizes valid",
    IS_ANNEAL_REQUEST_IN_PROGRESS = "Is anneal request in progress",
}

/** Shorthand for Getter enum above */
const G = AnnealCreatorGetter;

/** Type-safe getter function factory */
export function getFactory<T>(store: Store<T>, modulePrefix?: string) {
    const prefix = (modulePrefix !== undefined) ? `${modulePrefix}/` : "";

    return function get<G extends AnnealCreatorGetter, F extends GetterFunction<G>>(getter: G): ReturnType<F> {
        return store.getters[prefix + getter] as ReturnType<F>;
    }
}

/** Store getter functions */
const getters = {
    [G.HAS_SOURCE_FILE_DATA](state: State) {
        return state.recordData.source.length > 0;
    },

    [G.HAS_VALID_ID_COLUMN_INDEX](state: State) {
        return state.recordData.idColumn !== undefined;
    },

    [G.HAS_DUPLICATE_COLUMN_NAMES](state: State) {
        const columnNames = state.recordData.columns.map(column => column.label);
        const uniqueColumnNames = new Set(columnNames);
        return uniqueColumnNames.size !== columnNames.length;
    },

    [G.HAS_STRATA](state: State) {
        return state.strataConfig.strata.length > 0;
    },

    [G.HAS_CONSTRAINTS](state: State) {
        return state.constraintConfig.constraints.length > 0;
    },

    [G.IS_STRATA_CONFIG_NAMES_VALID](state: State) {
        const strata = state.strataConfig.strata;

        const strataNameSet = new Set<string>();

        for (let stratum of strata) {
            // We consider uniqueness regardless of case
            const label = stratum.label.trim().toLowerCase();

            // Do not permit blank string names
            if (label.length === 0) { return false; }

            // Do not permit "partition" as a name - it is reserved
            if (label === "partition") { return false; }

            strataNameSet.add(label);
        }

        // Do not permit non unique strata names
        if (strataNameSet.size !== strata.length) { return false; }

        // Otherwise we're good to go
        return true;
    },

    [G.IS_STRATA_CONFIG_SIZES_VALID](state: State) {
        const strata = state.strataConfig.strata;

        if (strata === undefined) { return false; }

        // Map out the size definitions for each stratum
        const strataSizes = strata.map(s => s.size);

        // All stratum sizes must be valid
        for (let size of strataSizes) {
            // Run validity checks
            if (
                // Values must be integers
                StratumSize.isSizeMinNotUint32(size) ||
                StratumSize.isSizeIdealNotUint32(size) ||
                StratumSize.isSizeMaxNotUint32(size) ||

                // Must be min <= ideal <= max
                StratumSize.isSizeMinGreaterThanIdeal(size) ||
                StratumSize.isSizeIdealGreaterThanMax(size) ||

                // Not permitted for min to equal max
                StratumSize.isSizeMinEqualToMax(size) ||

                // Minimum is always 1
                StratumSize.isSizeMinLessThanOne(size)
            ) {
                return false;
            }
        }

        // Check that group size calculations are possible over all partitions
        const columns = state.recordData.columns;
        const partitionColumnDescriptor = state.recordData.partitionColumn;

        const partitions = Partition.initManyFromPartitionColumnDescriptor(columns, partitionColumnDescriptor);

        try {
            partitions.forEach((partition) => {
                // Attempt group sizes for each partition
                const numberOfRecordsInPartition = Partition.getNumberOfRecords(partition);
                return StratumSize.generateStrataGroupSizes(strataSizes, numberOfRecordsInPartition);
            });
        } catch (e) {
            // Group size calculations failed
            return false;
        }

        // Otherwise we're good to go
        return true;
    },

    [G.IS_ANNEAL_REQUEST_IN_PROGRESS](state: State) {
        return AnnealRequestState.isInProgress(state.annealRequest);
    }
}

export function init() {
    return getters as GetterTree<State, State>;
}
