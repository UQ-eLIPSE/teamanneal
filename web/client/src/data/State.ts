import { Data as IColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "./ColumnData";
import { Data as IConstraint } from "./Constraint";
import { Stratum, Data as IStratum } from "./Stratum";
import { AnnealRequest, Data as IAnnealRequest } from "./AnnealRequest";
import { Partition } from "./Partition";

export interface Data {
    /** Record data */
    recordData: RecordData,

    /** Configuration of the anneal request */
    annealConfig: AnnealConfig,

    /** Information about request to the annealing server */
    annealRequest: IAnnealRequest | undefined,
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
            annealRequest: undefined,
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

    export function HasSourceFileData(state: Data) {
        return state.recordData.source.length > 0;
    }

    export function HasValidIdColumnIndex(state: Data) {
        return state.recordData.idColumn !== undefined;
    }

    export function HasStrata(state: Data) {
        return state.annealConfig.strata.length > 0;
    }

    export function HasConstraints(state: Data) {
        return state.annealConfig.constraints.length > 0;
    }

    export function IsStrataConfigNamesValid(state: Data) {
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

    export function IsStrataConfigSizesValid(state: Data) {
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

    export function IsAnnealRequestInProgress(state: Data) {
        return (
            state.annealRequest !== undefined &&
            !AnnealRequest.GetCompleted(state.annealRequest)    // Is not completed
        );
    }

    export function IsAnnealRequestCreated(state: Data) {
        return state.annealRequest !== undefined;
    }

    export function IsAnnealSuccessful(state: Data) {
        return (
            state.annealRequest !== undefined &&
            AnnealRequest.IsRequestSuccessful(state.annealRequest)
        );
    }













}

