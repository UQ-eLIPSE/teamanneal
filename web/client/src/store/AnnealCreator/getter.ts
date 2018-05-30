import { Store, GetterTree } from "vuex";
import { AnnealCreatorState as State } from "./state";

import * as Partition from "../../data/Partition";
import * as StratumSize from "../../data/StratumSize";
import * as AnnealRequestState from "../../data/AnnealRequestState";
import { ColumnData } from "../../data/ColumnData";

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
    HAS_DATA_IMPORT_MODE_SET = "Has data import mode set",
    VALID_ID_COLUMNS = "Valid ID columns",
    HAS_CONFIG = "Has config set",
    HAS_CONFIG_AND_SOURCE_FILE_DATA = "Has both config and source file data",
    HAS_VALID_PARTITION_COLUMN = "Has valid partition column",
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

        try {
            const partitions = Partition.initManyFromPartitionColumnDescriptor(columns, partitionColumnDescriptor);

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
    },

    [G.HAS_DATA_IMPORT_MODE_SET](state: State) {
        return state.dataImportMode !== undefined;
    },

    [G.VALID_ID_COLUMNS](state: State) {
        const recordData = state.recordData;
        const columns = recordData.columns;
        const recordDataRawLength = recordData.source.length;

        // The total number of records is equal to the full raw data array
        // length minus the header (1 row)
        const numberOfRecords = recordDataRawLength - 1;

        // Filter only those with column values unique
        return columns
            .filter((column) => {
                const valueSet = ColumnData.GetValueSet(column);
                return valueSet.size === numberOfRecords;
            });
    },

    [G.HAS_CONFIG](_state: State, getters: any) {
        // Config is assumed to be loaded when there is strata defined
        // 
        // TODO: Fix with type-safe accessors
        return getters[G.HAS_STRATA];
    },

    [G.HAS_CONFIG_AND_SOURCE_FILE_DATA](_state: State, getters: any) {
        // TODO: Fix with type-safe accessors
        return getters[G.HAS_CONFIG] && getters[G.HAS_SOURCE_FILE_DATA];
    },

    [G.HAS_VALID_PARTITION_COLUMN](state: State) {
        const recordData = state.recordData;
        const selectedPartitionColumn = recordData.partitionColumn;

        if (selectedPartitionColumn === undefined) {
            return true;
        }

        const columns = recordData.columns;

        // See if there is a column defined with the partition column's ID
        return columns.some(c => ColumnData.Equals(c, selectedPartitionColumn));
    },
}

export function init() {
    return getters as GetterTree<State, State>;
}
