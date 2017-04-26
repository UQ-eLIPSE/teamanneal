/*
 * TestFunction
 * 
 * 
 */
import * as SourceRecord from "./SourceRecord";
import * as SourceRecordSet from "./SourceRecordSet";
import * as Constraint from "./Constraint";
import * as Util from "./Util";


export type RecordValueTestFunction =
    (targetValue: SourceRecord.Value) =>
        (recordValue: SourceRecord.Value) => boolean;

export type RecordTestFunction =
    (record: SourceRecord.Record) => boolean;



export const countTestsOverRecords =
    (records: SourceRecordSet.SourceRecordSet) =>
        (testFunc: RecordTestFunction) => {
            return records.reduce(
                (count, record) => count + (testFunc(record) ? 1 : 0),
                0
            );
        }

export const mapFieldOperatorToRecordValueTestFunction =
    (fieldOperator: Constraint.CountableFieldOperator) => {
        // Field operator value check
        const $ = (op: Constraint.CountableFieldOperator) => fieldOperator === op;

        // Lookup
        if ($(0)) return eq;        // "equal to"
        if ($(1)) return neq;       // "not equal to"
        if ($(2)) return lte;       // "less than or equal to"
        if ($(3)) return lt;        // "less than"
        if ($(4)) return gte;       // "greater than or equal to"
        if ($(5)) return gt;        // "greater than"

        return Util.throwErr(new Error(`TestFunction: Unexpected field operator "${fieldOperator}"`))
    }



export const eq: RecordValueTestFunction =
    (targetValue) =>
        (recordValue) =>
            recordValue === targetValue;

export const neq: RecordValueTestFunction =
    (targetValue) =>
        (recordValue) =>
            recordValue !== targetValue;

export const lt: RecordValueTestFunction =
    (targetValue) =>
        (recordValue) =>
            (recordValue || 0) < (targetValue || 0);

export const gt: RecordValueTestFunction =
    (targetValue) =>
        (recordValue) =>
            (recordValue || 0) > (targetValue || 0);

export const lte: RecordValueTestFunction =
    (targetValue) =>
        (recordValue) =>
            (recordValue || 0) <= (targetValue || 0);

export const gte: RecordValueTestFunction =
    (targetValue) =>
        (recordValue) =>
            (recordValue || 0) >= (targetValue || 0);



export const testRecord =
    (testFunc: RecordValueTestFunction) =>
        (targetValue: SourceRecord.Value) =>
            (columnIndex: number): RecordTestFunction =>
                (record) => {
                    const recordValue = SourceRecord.get(record)(columnIndex);
                    return testFunc(targetValue)(recordValue);
                }
