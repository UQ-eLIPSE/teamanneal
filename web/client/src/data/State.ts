import { Data as IColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "./ColumnData";
import { Data as IConstraint } from "./Constraint";
import { Stratum, Data as IStratum } from "./Stratum";
import { Partition } from "./Partition";

export interface Data {
    /** Record data */
    recordData: RecordData,

    /** Configuration of the anneal request */
    annealConfig: AnnealConfig,
}

export interface RecordData {
    /** Data source (file, etc.) */
    source: {
        /** Name of source (file name, etc.) */
        name: string | undefined,

        /** Number of rows in raw file */
        length: number,
    },

    /** Data organised by column */
    columns: IColumnData[],

    /** ID column (ColumnData minimal descriptor) */
    idColumn: IColumnData_MinimalDescriptor | undefined,

    /** Partitioning column (ColumnData minimal descriptor) */
    partitionColumn: IColumnData_MinimalDescriptor | undefined,
}

export interface AnnealConfig {
    strata: IStratum[],

    constraints: IConstraint[],
}

export namespace State {
    export function Init() {
        const state: Data = {
            recordData: GenerateBlankRecordData(),
            annealConfig: GenerateBlankAnnealConfig(),
        };

        return state;
    }

    export function GenerateBlankRecordData() {
        const data: RecordData = {
            source: {
                name: undefined,
                length: 0,
            },

            columns: [],
            idColumn: undefined,
            partitionColumn: undefined,
        };

        return data;
    }

    export function GenerateBlankAnnealConfig() {
        const config: AnnealConfig = {
            strata: [],
            constraints: [],
        };

        return config;
    }








    /// TODO: Rename these static functions with capitalised first char





    export function hasSourceFileData(state: Data) {
        return state.recordData.source.length > 0;
    }

    export function hasValidIdColumnIndex(state: Data) {
        return state.recordData.idColumn !== undefined;
    }

    export function hasStrata(state: Data) {
        return state.annealConfig.strata.length > 0;
    }

    export function hasConstraints(state: Data) {
        return state.annealConfig.constraints.length > 0;
    }

    export function isStrataConfigNamesValid(state: Data) {
        const strata = state.annealConfig.strata;

        const strataNameSet = new Set<string>();

        for (let i = 0; i < strata.length; ++i) {
            const stratum = strata[i];

            // We consider uniqueness regardless of case
            const label = stratum.label.trim().toLowerCase();

            // Do not permit blank string names
            if (label.length === 0) { return false; }

            strataNameSet.add(label);
        }

        // Do not permit non unique strata names
        if (strataNameSet.size !== strata.length) { return false; }

        // Otherwise we're good to go
        return true;
    }

    export function isStrataConfigSizesValid(state: Data) {
        const strata = state.annealConfig.strata;

        if (strata === undefined) { return false; }

        // All stratum sizes must be valid
        for (let i = 0; i < strata.length; ++i) {
            const stratum = strata[i];

            // Run validity checks
            if (
                // Values must be integers
                Stratum.IsSizeMinNotUint32(stratum) ||
                Stratum.IsSizeIdealNotUint32(stratum) ||
                Stratum.IsSizeMaxNotUint32(stratum) ||

                // Must be min <= ideal <= max
                Stratum.IsSizeMinGreaterThanIdeal(stratum) ||
                Stratum.IsSizeIdealGreaterThanMax(stratum) ||

                // Not permitted for min to equal max
                Stratum.IsSizeMinEqualToMax(stratum) ||

                // Minimum is always 1
                Stratum.IsSizeMinLessThanOne(stratum)
            ) {
                return false;
            }
        }

        // Check that group size calculations are possible over all partitions
        const columns = state.recordData.columns;
        const partitionColumnDescriptor = state.recordData.partitionColumn;

        const partitions = Partition.InitManyFromPartitionColumnDescriptor(columns, partitionColumnDescriptor);

        try {
            partitions.forEach((partition) => {
                // Attempt group sizes for each partition
                const numberOfRecordsInPartition = Partition.GetNumberOfRecords(partition);
                return Stratum.GenerateStrataGroupSizes(strata, numberOfRecordsInPartition);
            });
        } catch (e) {
            // Group size calculations failed
            return false;
        }

        // Otherwise we're good to go
        return true;
    }

    export function isAnnealRequestInProgress(state: Data) {
        return (
            state.anneal &&
            state.anneal.input &&                   // Has an input anneal request
            state.anneal.ajaxCancelTokenSource &&   // Has a cancel token set up
            !state.anneal.output &&                 // But doesn't have a output or error yet
            !state.anneal.outputError
        );
    }

    export function isAnnealRequestCreated(state: Data) {
        return (
            state.anneal &&
            state.anneal.ajaxCancelTokenSource
        );
    }

    export function isAnnealSuccessful(state: Data) {
        return (
            state.anneal &&
            state.anneal.output &&
            !state.anneal.outputError
        );
    }













}

