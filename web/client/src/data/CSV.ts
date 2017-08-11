import * as Papa from "papaparse";
import * as FileSaver from "file-saver";

import { transpose as arrayTranspose } from "../util/Array";

export async function parseFile(file: File) {
    const parseResult = await new Promise<PapaParse.ParseResult>((resolve, reject) => {
        Papa.parse(file, {
            dynamicTyping: false,   // Do not auto convert things like numbers
            header: false,          // Don't try to convert into objects, read entire file as string[][]
            worker: false,          // DO NOT use web workers, as there is a problem with Webpack, papaparse and workers
            skipEmptyLines: true,

            complete: resolve,
            error: reject,
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

export async function unparseFile(rows: (string | null)[][], filename: string) {
    const csvString = Papa.unparse(rows);
    const csvBlob = new Blob([csvString], { type: "text/csv;charset=utf-8" });

    FileSaver.saveAs(csvBlob, filename, true);
}

export function transpose(arr: (string | null)[][]) {
    return arrayTranspose(arr);
}
