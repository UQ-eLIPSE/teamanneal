import { Data as IColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "./ColumnData";

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
