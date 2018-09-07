import { ColumnData, Data as IColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "./ColumnData";

import { parseFile, trimWhollyEmptyRows } from "../util/CSV";
import { fillGaps, transpose } from "../util/Array";

export interface RecordDataSource {
    /** Name of source (file name, etc.) */
    name: string | undefined,

    /** Number of rows in raw file */
    length: number,

    /** Data organised by column */
    columns: IColumnData[],
}

export interface RecordData {
    /** Data source (file, etc.) */
    source: RecordDataSource,

    /** ID column (ColumnData minimal descriptor) */
    idColumn: IColumnData_MinimalDescriptor | undefined,

    /** Partitioning column (ColumnData minimal descriptor) */
    partitionColumn: IColumnData_MinimalDescriptor | undefined,
}

export function init(sourceName: string | undefined = undefined, sourceLength: number = 0, columns: IColumnData[] = [], idColumn: IColumnData_MinimalDescriptor | undefined = undefined, partitionColumn: IColumnData_MinimalDescriptor | undefined = undefined) {
    const obj: RecordData = {
        source: {
            name: sourceName,
            length: sourceLength,
            columns,
        },
        idColumn,
        partitionColumn,
    };

    return obj;
}

export async function parseFileToRecordData(file: File, previousRecordData?: RecordData) {
    const parseResult = await parseFile(file);
    const data: string[][] = parseResult.data;

    // Trim wholly empty rows encountered when people use Excel or the like to
    // generate CSVs and not realise they filled in blank information
    const rows = trimWhollyEmptyRows(data);

    // Fill gaps in file data array to make it rectangular
    // Note that this operates in place!
    fillGaps(rows);

    // Convert rows with strings into columns
    const columns =
        transpose(rows)    // Transpose rows into columns
            .map((columnValues) => {
                // First value is always assumed to be the column label 
                // (the header string)
                const label = "" + columnValues.shift();

                // Initialise a new ColumnData object
                // Remember that the shift pops off the header value from 
                // the column values
                return ColumnData.Init(columnValues, label);
            });

    // If previous record data is defined, we attempt to pass on the information
    // to the new RecordData object
    if (previousRecordData !== undefined) {
        const idColumn = ColumnData.MatchOldColumnInNewColumns(columns, previousRecordData.idColumn, false);
        const partitionColumn = ColumnData.MatchOldColumnInNewColumns(columns, previousRecordData.partitionColumn, false);

        return init(
            file.name,
            rows.length,
            columns,
            idColumn && ColumnData.ConvertToMinimalDescriptor(idColumn),
            partitionColumn && ColumnData.ConvertToMinimalDescriptor(partitionColumn),
        );
    } else {
        return init(
            file.name,
            rows.length,
            columns,
        );
    }
}
