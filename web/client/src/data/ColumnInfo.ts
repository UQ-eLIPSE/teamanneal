/**
 * Describes the information of one column.
 */
export type ColumnInfo = ColumnInfoBase & (
    ColumnInfoNumber |
    ColumnInfoString
)

interface ColumnInfoBase {
    /** The name or heading of the column */
    label: string,
    /** Index of the column */
    index: number,
}

interface ColumnInfoNumber {
    type: "number",
    /** Contains the set of unique values present in the column */
    valueSet: Set<number>,
    /** Range = max - min */
    range: number,
    /** The minimum numeric value in the column */
    min: number,
    /** The maximum numeric value in the column */
    max: number,
}

interface ColumnInfoString {
    type: "string",
    /** Contains the set of unique values present in the column */
    valueSet: Set<string>,
}

export interface ReplaceUpdate {
    oldColumnInfo: ColumnInfo,
    newColumnInfo: ColumnInfo,
}

export function createColumnInfoNumber(label: string, index: number, valueSet: Set<number>) {
    // Calculate range, min, max
    const array: number[] = [];
    valueSet.forEach(value => {
        // If value is NaN, we can't use that for the range calculation, so we ignore them
        if (value === null || Number.isNaN(value)) { return; }

        array.push(value);
    });

    // We need something to actually work with to calculate the min, max, range
    if (array.length === 0) {
        throw new Error("No information about numeric column was able to be generated");
    }

    // Sort the array so we can read out the min, max
    array.sort();

    const min = array[0];
    const max = array[array.length - 1];
    const range = max - min;

    const columnInfo: ColumnInfo = {
        type: "number",
        index,
        label,
        valueSet,
        min,
        max,
        range,
    };

    return columnInfo;
}

export function createColumnInfoString(label: string, index: number, valueSet: Set<string>) {
    const columnInfo: ColumnInfo = {
        type: "string",
        index,
        label,
        valueSet,
    };

    return columnInfo;
}

export function extractColumnValues(rawData: ReadonlyArray<ReadonlyArray<string | number>>, columnIndex: number, ignoreFirstRow: boolean) {
    // Map out one set for each column in which to store their unique values
    const valueSet = new Set<string | number>();

    // Go through all data rows and store the value into the set
    // If `ignoreFirstRow` we start from index 1
    for (let rowIndex = (ignoreFirstRow ? 1 : 0); rowIndex < rawData.length; ++rowIndex) {
        const row = rawData[rowIndex];

        const value: string | number | undefined = row[columnIndex];

        // Ignore undefined values (actually missing data) in column
        if (value === undefined) { continue; }

        valueSet.add(value);
    }

    return valueSet;
}

export function fromRawData(headers: ReadonlyArray<string>, rawData: ReadonlyArray<ReadonlyArray<string | number>>, ignoreFirstRow: boolean) {
    // Map out the values in each column
    const columnValueSets = headers.map((_, i) => extractColumnValues(rawData, i, ignoreFirstRow));

    // Go through all sets and determine their type
    const outputColumnInfos: ReadonlyArray<ColumnInfo> =
        columnValueSets.map((valueSet: Set<string | number>, colIndex) => {
            // Start off by assuming the column is numeric
            let isNumber = true;

            valueSet.forEach((value) => {
                // If already not a number, then short circuit for-each
                if (!isNumber) { return; }

                // If the value is a string, we need to check if it'll change
                // the column type
                if (typeof value === "string") {
                    if (value.length === 0) {
                        // Ignore blank strings
                        return;
                    }

                    // If a string is present then we can no longer say that
                    // the column is a number
                    isNumber = false;
                }
            });

            if (isNumber) {
                // Remove blank string from set if present
                valueSet.delete("");

                return createColumnInfoNumber(headers[colIndex], colIndex, valueSet as Set<number>);
            } else {
                return createColumnInfoString(headers[colIndex], colIndex, valueSet as Set<string>);
            }
        });

    return outputColumnInfos;
}
