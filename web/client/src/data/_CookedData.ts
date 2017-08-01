import * as ColumnInfo from "./ColumnInfo";

export function cook(columnInfo: ReadonlyArray<ColumnInfo.ColumnInfo>, rawData: ReadonlyArray<ReadonlyArray<string | number>>, ignoreFirstRow: boolean) {
    // Ignore the first row by taking a new slice from the 2nd row onwards
    if (ignoreFirstRow) {
        rawData = rawData.slice(1);
    }

    // Map over the raw data to get the cooked representation
    const columnInfoLength = columnInfo.length;

    const cookedData: ReadonlyArray<ReadonlyArray<string | number | null>> =
        rawData.map((row) => {
            // We always use columnInfo array as the reference for the size of
            // the out array, in case the input row is either too short or long.
            const cookedRow: (string | number | null)[] = new Array(columnInfoLength);

            for (let colIndex = 0; colIndex < columnInfoLength; ++colIndex) {
                const colInfo = columnInfo[colIndex];
                const element: string | number | undefined = row[colIndex];

                switch (colInfo.type) {
                    case "string": {
                        // Put in a blank string if element is undefined
                        if (typeof element === "undefined") {
                            cookedRow[colIndex] = "";
                            break;
                        }

                        // Convert everything to a string
                        cookedRow[colIndex] = "" + element;

                        break;
                    }

                    case "number": {
                        // Put in `null` if element is undefined or empty string
                        if (typeof element === "undefined" ||
                            (typeof element === "string" && element.trim().length === 0)) {
                            cookedRow[colIndex] = null;
                            break;
                        }

                        // Convert everything else to a number
                        // NOTE: This may produce NaN, and converts number-like 
                        // values under ECMAScript rules (e.g. "0xF" => 15)
                        cookedRow[colIndex] = +element;

                        break;
                    }

                    default:
                        throw new Error("Unknown column info type");
                }
            }

            return cookedRow;
        });

    return cookedData;
}
