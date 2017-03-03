/*
 * SourceRecord
 * 
 * Represents records in the source data (e.g. class list)
 */
import * as Util from "./Util";
import * as StringMap from "./StringMap";
// import * as ColumnInfo from "./ColumnInfo";      <---- Doing this will result in circular reference
import * as ColumnDesc from "./ColumnDesc";


// Equivalent type to ColumnInfo.ColumnInfo
type ColumnInfo_ColumnInfo = Array<ColumnDesc.ColumnDesc>;



export interface Record extends Array<Value> { };
export type RawRecord = ReadonlyArray<RawValue>;

export type Value = number;
export type RawValue = number | string;




export const init =
    (size: number): Record => {
        return Util.initArray(NaN)(size);
    }

export const initFrom =
    (columnInfo: ColumnInfo_ColumnInfo) =>
        (stringMap: StringMap.StringMap) =>
            (rawRecord: RawRecord): Record => {
                return rawRecord.map((val, i) => {
                    const columnDesc = columnInfo[i];

                    // Use column info type information to determine what to do
                    if (ColumnDesc.isString(columnDesc)) {
                        const str = "" + val;   // Convert to string
                        return StringMap.add(stringMap)(str);
                    }

                    if (ColumnDesc.isNumeric(columnDesc)) {
                        if (typeof val === "number") {
                            return val;     // Pass number as is
                        } else {
                            return NaN;     // Blank or invalid value
                        }
                    }

                    return Util.throwErr(new Error(`SourceRecord: Unexpected value ${val}`));
                });
            }

export const get =
    (record: Record) =>
        (columnIndex: number) => {
            return record[columnIndex];
        }

export const set =
    (record: Record) =>
        (columnIndex: number) =>
            (value: Value) => {
                return record[columnIndex] = value;
            }
