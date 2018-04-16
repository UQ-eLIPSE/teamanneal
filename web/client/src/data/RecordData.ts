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

export function initNew(sourceName: string | undefined = undefined, sourceLength: number = 0, columns: IColumnData[] = [], idColumn: IColumnData_MinimalDescriptor | undefined = undefined, partitionColumn: IColumnData_MinimalDescriptor | undefined = undefined) {
    const obj: RecordData = {
        source: {
            name: sourceName,
            length: sourceLength,
        },
        columns,
        idColumn,
        partitionColumn,
    };

    return obj;
}
