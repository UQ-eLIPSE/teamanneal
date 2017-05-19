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
    // TODO: Expand to precompute range, min, max
}

interface ColumnInfoString {
    type: "string",
    valueSet: Set<string | null>,
}




export function fromRawData(rawData: (string | number)[][]) {
    // Compute column info
    // TODO: Check for header-ness/stringiness
    const headers = rawData[0] as string[];

    const columnInfo = headers.map((label, _i) => {
        const info: ColumnInfo = {
            label,
            type: "string",         // TODO: Actually determine the type
            valueSet: new Set(),    // TODO: 
        }

        return info;
    });

    return columnInfo;
}
