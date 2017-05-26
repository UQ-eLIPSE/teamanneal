export type ColumnInfo = ColumnInfoBase & (
    ColumnInfoNumber |
    ColumnInfoString
)

interface ColumnInfoBase {
    label: string,
}

interface ColumnInfoNumber {
    type: "number",
    valueSet: Set<number | null>,
    range: number,
    min: number,
    max: number,
}

interface ColumnInfoString {
    type: "string",
    valueSet: Set<string>,
}




export function fromRawData(rawData: (string | number)[][]) {
    // TODO: Check for header-ness/stringiness
    const headers = rawData[0] as string[];
    const columns = headers.length;

    // Prepare partial column info objects which are expanded in the loop below
    const partialColumnInfos: Partial<ColumnInfo>[] = headers.map(label => ({ label, valueSet: new Set() }));

    // We start from i=1 as the 0th row is the header
    for (let rowIndex = 1; rowIndex < rawData.length; ++rowIndex) {
        const row = rawData[rowIndex];

        for (let colIndex = 0; colIndex < columns; ++colIndex) {
            const value = row[colIndex];
            const columnInfo = partialColumnInfos[colIndex];

            // Add value to set now
            const set: Set<string | number | null> = columnInfo.valueSet!;
            set.add(value);

            // Check that type hasn't already been set
            if (columnInfo.type !== undefined) {
                // Go to next column
                continue;
            }

            if (typeof value === "string" && value.length > 0) {
                columnInfo.type = "string";
            }
        }
    }

    // Check over all column info and expand as necessary
    const outputColumnInfos: ColumnInfo[] = partialColumnInfos.map(
        (_columnInfo) => {
            // Type check values if not already set
            if (_columnInfo.type === undefined) {
                // Start off by assuming it's a number
                let isNumber = true;

                const set: Set<string | number | null> = _columnInfo.valueSet!;

                set.forEach((value) => {
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
                    _columnInfo.type = "number";

                    // Remove blank string from set
                    set.delete("");
                } else {
                    _columnInfo.type = "string";
                }
            }

            switch (_columnInfo.type) {
                case "number": {
                    // Calculate range, min, max
                    const array: (number | null)[] = [];
                    _columnInfo.valueSet!.forEach(value => array.push(value));

                    array.sort();

                    const min = array[0]!;
                    const max = array[array.length - 1]!;
                    const range = max - min;

                    _columnInfo.min = min;
                    _columnInfo.max = max;
                    _columnInfo.range = range;

                    break;
                }
                case "string": {
                    // Currently doesn't do anything
                    break;
                }

                default: throw new Error("Unknown column type");
            }

            // At this point the partial column info object should be complete
            return _columnInfo as ColumnInfo;
        }
    );

    return outputColumnInfos;
}
