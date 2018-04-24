import { Stratum } from "./Stratum";
import { Partition } from "./Partition";
import { RecordData } from "./RecordData";
import { AnnealConfig } from "./AnnealConfig";
import { Data as IAnnealRequest } from "./AnnealRequest";
import { AnnealResponse, Data as IAnnealResponse } from "./AnnealResponse";

export interface Data {
    /** Record data */
    recordData: RecordData,

    /** Configuration of the anneal request */
    annealConfig: AnnealConfig,

    /** Information about request to the annealing server */
    annealRequest: IAnnealRequest | undefined,

    /** Information about response from the annealing server */
    annealResponse: IAnnealResponse | undefined,
}

export namespace State {
    export function Init() {
        const state: Data = {
            recordData: GenerateBlankRecordData(),
            annealConfig: GenerateBlankAnnealConfig(),
            annealRequest: undefined,
            annealResponse: undefined,
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
            namingConfig: {
                combined: {
                    format: undefined,
                    userProvided: false,    // We always start off assuming the system is responsible for the combined name format
                },
            },
            constraints: [],
        };

        return config;
    }

    export function HasSourceFileData({ recordData }: Data) {
        return recordData.source.length > 0;
    }

    export function HasValidIdColumnIndex({ recordData }: Data) {
        return recordData.idColumn !== undefined;
    }

    /**
     * Returns true if a duplicate column name (case sensitive) is encountered in recordData
     */
    export function HasDuplicateColumnNames({ recordData }: Data) {
        const columnNames = recordData.columns.map(column => column.label);
        const uniqueColumnNames = new Set(columnNames);
        return uniqueColumnNames.size !== columnNames.length;
    }

    export function HasStrata({ annealConfig }: Data) {
        return annealConfig.strata.length > 0;
    }

    export function HasConstraints({ annealConfig }: Data) {
        return annealConfig.constraints.length > 0;
    }

    export function IsStrataConfigNamesValid({ annealConfig }: Data) {
        const strata = annealConfig.strata;

        const strataNameSet = new Set<string>();

        for (let i = 0; i < strata.length; ++i) {
            const stratum = strata[i];

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
    }

    export function IsStrataConfigSizesValid({ annealConfig, recordData }: Data) {
        const strata = annealConfig.strata;

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
        const columns = recordData.columns;
        const partitionColumnDescriptor = recordData.partitionColumn;

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

    export function IsAnnealRequestInProgress({ annealRequest, annealResponse }: Data) {
        return (
            annealRequest !== undefined &&
            (
                annealResponse === undefined ||     // No response object set up yet
                (
                    // Check if request object matches and if we have NOT yet
                    // received a response
                    AnnealResponse.RequestMatchesResponse(annealRequest, annealResponse) &&
                    !AnnealResponse.IsResponseReceived(annealResponse)
                )
            )
        );
    }

    export function IsAnnealRequestCreated({ annealRequest }: Data) {
        return annealRequest !== undefined;
    }

    export function IsAnnealRequestSuccessful({ annealRequest, annealResponse }: Data) {
        return (
            annealRequest !== undefined &&
            annealResponse !== undefined &&
            AnnealResponse.RequestMatchesResponse(annealRequest, annealResponse) &&
            AnnealResponse.IsSuccessful(annealResponse)
        );
    }
}

