import { Data as IColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "./ColumnData";
import { Data as IConstraint } from "./Constraint";
import { Data as IStratum } from "./Stratum";

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

}

