// import * as Config from "./Config";
import * as SourceRecord from "./SourceRecord";



export type ColumnInfo =
    ColumnInfoNumber |
    ColumnInfoString;

export interface ColumnInfoNumber {
    readonly type: "number",

    readonly range: ColumnInfoNumberRange,
}

export interface ColumnInfoNumberRange {
    readonly min: number,
    readonly max: number,
}

export interface ColumnInfoString {
    readonly type: "string",

    readonly distinctValues: number,
}







export const isNumeric =
    (columnInfo: ColumnInfo): columnInfo is ColumnInfoNumber => columnInfo.type === "number";

export const isString =
    (columnInfo: ColumnInfo): columnInfo is ColumnInfoString => columnInfo.type === "string";





export const generateColumnInfo =
    (sourceRecordSet: SourceRecord.Set) =>
        (column: string) => {
            const type = detectColumnType(sourceRecordSet)(column);

            switch (type) {
                case "number": {
                    const columnInfo: ColumnInfo = {
                        type,
                        range: getColumnValueRange(sourceRecordSet)(column),
                    }

                    return columnInfo;
                }

                case "string": {
                    const columnInfo: ColumnInfo = {
                        type,
                        distinctValues: getColumnValueSet(sourceRecordSet)(column).size,
                    }

                    return columnInfo;
                }
            }

            throw new Error(`Unexpected column type "${type}" for column "${column}"`);
        }

export const detectColumnType =
    (sourceRecordSet: SourceRecord.Set) =>
        (column: string) => {
            for (let i = 0; i < sourceRecordSet.length; ++i) {
                const record = SourceRecord.getIthRecord(sourceRecordSet)(i);
                const value = SourceRecord.getRecordValue(record)(column);

                // Skip to next record if null
                if (value === null) {
                    continue;
                }

                // Detect type
                const type = typeof value;

                switch (type) {
                    case "string": {
                        // Don't accept determination on a blank string
                        if ((value as string).length === 0) { continue; }
                        
                        return type;
                    }
                    case "number":
                        return type;
                }

                throw new Error(`Unexpected value type "${type}" in column "${column}"`);
            }

            throw new Error(`Undetectable value type in column "${column}"`);
        }

export const getColumnValueRange =
    (sourceRecordSet: SourceRecord.Set) =>
        (column: string) => {
            const startRange: ColumnInfoNumberRange = {
                min: Infinity,
                max: -Infinity,
            }

            return sourceRecordSet.reduce(
                (range, record) => {
                    const value = SourceRecord.getRecordValue(record)(column) as number;

                    const newRange: ColumnInfoNumberRange = {
                        min: Math.min(range.min, value),
                        max: Math.max(range.max, value),
                    }

                    return newRange;
                },
                startRange
            );
        }

export const getColumnValueSet =
    (sourceRecordSet: SourceRecord.Set) =>
        (column: string) => {
            return sourceRecordSet.reduce(
                (set, record) => {
                    const value = SourceRecord.getRecordValue(record)(column);
                    return set.add(value);
                },
                new Set<SourceRecord.Value>()
            );
        }
