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

export async function parseCsvFile(file: File) {
    const parseResult = await new Promise<PapaParse.ParseResult>((resolve, reject) => {
        Papa.parse(file, {
            dynamicTyping: true,    // Auto convert numbers
            header: false,          // Don't try to convert into objects, preserve as val[][] type
            complete: resolve,
            error: reject,
            worker: false,          // DO NOT use web workers, as there is a problem with Webpack, papaparse and workers
            skipEmptyLines: true,
        });
    });

    // If errors encountered
    if (parseResult.errors.length) {
        console.error(parseResult.errors);
        alert("Errors encountered during parse - see console");
        throw new Error("Errors encountered during parse");
    }

    return parseResult;
}
