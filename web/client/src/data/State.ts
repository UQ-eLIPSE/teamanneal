import { Data as IColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "./ColumnData";
import { Data as IConstraint } from "./Constraint";
import { Data as IStratum } from "./Stratum";

export interface Data {
    /** Record data */
    data: RecordData,

    /** Configuration of the anneal request */
    annealConfig: AnnealConfig,
}

interface RecordData {
    /** Data source (file, etc.) */
    source: {
        /** Name of source (file name, etc.) */
        name: string | undefined,
    },

    /** Data organised by column */
    columns: IColumnData[],

    /** ID column (ColumnData minimal descriptor) */
    idColumn: IColumnData_MinimalDescriptor | undefined,

    /** Partitioning column (ColumnData minimal descriptor) */
    partitioningColumn: IColumnData_MinimalDescriptor | undefined,
}

interface AnnealConfig {
    strata: IStratum[],

    constraints: IConstraint[],
}

export namespace State {
    export function Init() {
        const state: Data = {
            data: GenerateBlankRecordData(),
            annealConfig: GenerateBlankAnnealConfig(),
        };

        return state;
    }

    export function GenerateBlankRecordData() {
        const data: RecordData = {
            source: {
                name: undefined,
            },

            columns: [],
            idColumn: undefined,
            partitioningColumn: undefined,
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

}

