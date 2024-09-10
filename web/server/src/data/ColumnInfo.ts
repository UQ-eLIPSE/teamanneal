import * as Record from "../../../common/Record";
import * as RecordDataColumn from "../../../common/RecordDataColumn";

import * as Util from "../core/Util";

/**
 * An object which contains information about the column from the full set of 
 * records.
 */
export type ColumnInfo =
    ColumnInfoNumber |
    ColumnInfoString;

interface ColumnInfoNumber extends RecordDataColumn.ColumnDesc, ColumnInfoNumberDetails {
    readonly type: "number",
}

interface ColumnInfoString extends RecordDataColumn.ColumnDesc, ColumnInfoStringDetails {
    readonly type: "string",
}


interface ColumnInfoNumberDetails {
    /** Minimum numeric value contained in column */
    readonly min: number,

    /** Maximum numeric value contained in column */
    readonly max: number,

    /** Range of numeric values contained in column */
    readonly range: number,
}

interface ColumnInfoStringDetails {
    /** Number of distinct strings contained in column */
    readonly distinct: number,
}





export function initFromColumnIndex(records: Record.RecordSet, index: number, column: RecordDataColumn.ColumnDesc) {
    const recordElements = records.map(record => record[index]);
    return init(recordElements, column);
}

export function init(recordElements: ReadonlyArray<Record.RecordElement>, column: RecordDataColumn.ColumnDesc): ColumnInfo {
    switch (column.type) {
        case "number": {
            let min: number = Number.POSITIVE_INFINITY;
            let max: number = Number.NEGATIVE_INFINITY;

            recordElements.forEach((val) => {
                // Skip non-numbers
                if (typeof val !== "number") {
                    return;
                }

                if (val < min) {
                    min = val;
                }

                if (val > max) {
                    max = val;
                }
            });

            const info: ColumnInfoNumberDetails = {
                min,
                max,
                range: max - min,
            }

            return Util.zipObjects(column, info) as ColumnInfoNumber;
        }

        case "string": {
            // NOTE: This takes ALL value types (string, number, null) into
            // consideration when calculating distinct values
            const recordElementSet = new Set<Record.RecordElement>();

            recordElements.forEach((val) => {
                recordElementSet.add(val);
            });

            const info: ColumnInfoStringDetails = {
                distinct: recordElementSet.size,
            }

            return Util.zipObjects(column, info) as ColumnInfoString;
        }

        default: throw new Error("Unrecognised column type");
    }
}

export function getIdColumnIndex(columns: ReadonlyArray<RecordDataColumn.ColumnDesc>) {
    const idColumnIndex = columns.findIndex(x => x.isId);

    if (idColumnIndex < 0) {
        throw new Error("No ID column found");
    }

    return idColumnIndex;
}
