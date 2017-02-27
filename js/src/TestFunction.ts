import * as Config from "./Config";
import * as SourceRecord from "./SourceRecord";


export type RecordValueTestFunction =
    (targetValue: SourceRecord.Value) =>
        (recordValue: SourceRecord.Value) => boolean;

export type RecordTestFunction =
    (record: SourceRecord.Record) => boolean;



export const countTestsOverRecords =
    (records: SourceRecord.Set) =>
        (testFunc: RecordTestFunction) => {
            return records.reduce(
                (count, record) => count + (testFunc(record) ? 1 : 0),
                0
            );
        }

export const mapFieldOperatorToRecordValueTestFunction =
    (fieldOperator: Config.ConstraintCountableFieldOperator) => {
        switch (fieldOperator) {
            case "equal to":
                return eq;
            case "not equal to":
                return neq;
            case "less than or equal to":
                return lte;
            case "less than":
                return lt;
            case "greater than or equal to":
                return gte;
            case "greater than":
                return gt;
        }

        throw new Error(`Unexpected field operator "${fieldOperator}"`);
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
            (column: string): RecordTestFunction =>
                (record) => {
                    const recordValue = SourceRecord.getRecordValue(record)(column);
                    return testFunc(targetValue)(recordValue);
                }


