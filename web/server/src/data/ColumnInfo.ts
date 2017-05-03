import * as Record from "../../../common/Record";
import * as SourceDataColumn from "../../../common/SourceDataColumn";

import * as Util from "../core/Util";

/**
 * An object which contains information about the column from the full set of 
 * records.
 */
export type ColumnInfo = SourceDataColumn.ColumnDesc &
    (ColumnInfoNumber | ColumnInfoString);

interface __ColumnInfo {
    // Type values must be the same as those in SourceDataColumn
    readonly type: SourceDataColumn.ColumnType,
}

interface ColumnInfoNumber extends __ColumnInfo {
    readonly type: "number",

    /** Minimum numeric value contained in column */
    readonly min: number,

    /** Maximum numeric value contained in column */
    readonly max: number,
}

interface ColumnInfoString extends __ColumnInfo {
    readonly type: "string",

    /** Number of distinct strings contained in column */
    readonly distinct: number,
}






export function initFromColumnIndex(records: ReadonlyArray<Record.Record>, index: number, column: SourceDataColumn.ColumnDesc) {
    const recordElements = records.map(record => record[index]);
    return init(recordElements, column);
}

export function init(recordElements: ReadonlyArray<Record.RecordElement>, column: SourceDataColumn.ColumnDesc): ColumnInfo {
    switch (column.type) {
        case "number": {
            let min: number = Number.POSITIVE_INFINITY;
            let max: number = Number.NEGATIVE_INFINITY;

            recordElements.forEach((val: number) => {
                if (val < min) {
                    min = val;
                }

                if (val > max) {
                    max = val;
                }
            });

            const info: ColumnInfoNumber = {
                type: "number",
                min,
                max,
            }

            return Util.zipObjects(column, info);
        }

        case "string": {
            const stringSet = new Set<string>();

            recordElements.forEach((val: string) => {
                stringSet.add(val);
            });

            const info: ColumnInfoString = {
                type: "string",
                distinct: stringSet.size,
            }

            return Util.zipObjects(column, info);
        }
    }

    throw new Error("Unrecognised column type");
}
