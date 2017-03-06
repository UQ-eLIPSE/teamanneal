/*
 * SourceRecordSet
 * 
 * Represents a set of SourceRecords.
 */
import * as StringMap from "./StringMap";
import * as ColumnInfo from "./ColumnInfo";
import * as SourceRecord from "./SourceRecord";



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
            return set[i];
        }

export const set =
    (set: SourceRecordSet) =>
        (i: number) =>
            (record: SourceRecord.Record) => {
                return set[i] = record;
            }

export const push =
    (set: SourceRecordSet) =>
        (record: SourceRecord.Record) => {
            set.push(record);
            return set;
        }

export const shallowCopy =
    (set: SourceRecordSet): SourceRecordSet => set.slice();

export const size = (set: SourceRecordSet) => set.length;
