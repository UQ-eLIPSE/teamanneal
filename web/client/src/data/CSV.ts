import * as Papa from "papaparse";
import * as FileSaver from "file-saver";

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

export async function unparseFile(rows: string[][], filename: string) {
    const csvString = Papa.unparse(rows);
    const csvBlob = new Blob([csvString], { type: "text/csv;charset=utf-8" });

    FileSaver.saveAs(csvBlob, filename, true);

    return undefined;
}

export function rowsToColumns(rows: string[][]) {
    // Pick up the maximum length of a row => number of columns to generate
    let numberOfColumns = 0;

    for (let i = 0; i < rows.length; ++i) {
        const thisRowLength = rows[i].length;

        if (thisRowLength > numberOfColumns) {
            numberOfColumns = thisRowLength;
        }
    }

    // Initialise the 2D array for columns
    const columns: (string | undefined)[][] = [];

    for (let i = 0; i < numberOfColumns; ++i) {
        columns.push([]);
    }

    // Go into each row again and now append values into each column as
    // appropriate
    for (let i = 0; i < rows.length; ++i) {
        const thisRow = rows[i];

        for (let j = 0; j < numberOfColumns; ++j) {
            const columnValues = columns[j];
            const rowElementValue: string | undefined = thisRow[j];

            columnValues.push(rowElementValue);
        }
    }

    return columns;
}
