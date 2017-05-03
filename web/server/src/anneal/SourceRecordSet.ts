/*
 * SourceRecordSet
 * 
 * Represents a set of SourceRecords.
 */
import * as StringMap from "./StringMap";
import * as ColumnInfo from "./ColumnInfo";
import * as SourceRecord from "./SourceRecord";

import * as Util from "../core/Util"; 



export interface SourceRecordSet extends Array<SourceRecord.Record> { };



export const init =
    (): SourceRecordSet => {
        return [];
    }

export const initFrom =
    (columnInfo: ColumnInfo.ColumnInfo) =>
        (stringMap: StringMap.StringMap) =>
            (rawRecords: SourceRecord.RawRecord[]) => {
                return rawRecords.map(SourceRecord.initFrom(columnInfo)(stringMap));
            }

export const get =
    (set: SourceRecordSet) =>
        (i: number) => {
            if (i < 0 || i >= set.length) {
                return Util.throwErr(new Error("SourceRecordSet: Out-of-bounds access"));
            }
            return set[i];
        }

export const set =
    (set: SourceRecordSet) =>
        (i: number) => {
            if (i < 0 || i >= set.length) {
                return Util.throwErr(new Error("SourceRecordSet: Out-of-bounds access"));
            }

            return (record: SourceRecord.Record) => {
                return set[i] = record;
            }
        }

export const push =
    (set: SourceRecordSet) =>
        (record: SourceRecord.Record) => {
            // Pushes should be idempotent
            if (set.indexOf(record) > -1) {
                return set;
            }

            set.push(record);
            return set;
        }

export const shallowCopy =
    (set: SourceRecordSet): SourceRecordSet => set.slice();

export const size = (set: SourceRecordSet) => set.length;
