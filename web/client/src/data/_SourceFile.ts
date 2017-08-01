import * as Papa from "papaparse";

import * as ColumnInfo from "./ColumnInfo";

export interface SourceFile {
    /** The name of the source file */
    name: string,
    /** All raw data contained in the source file, including headers */
    rawData: ReadonlyArray<ReadonlyArray<string | number>>,
    /** Processed, converted and normalised data */
    cookedData: ReadonlyArray<ReadonlyArray<string | number | null>>,
    /** An array of each column's information */
    columnInfo: ColumnInfo.ColumnInfo[],
}
