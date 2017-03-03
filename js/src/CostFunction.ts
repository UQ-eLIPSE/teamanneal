/*
 * CostFunction
 * 
 * 
 */
import * as SourceRecord from "./SourceRecord";
import * as SourceRecordSet from "./SourceRecordSet";
import * as Constraint from "./Constraint";
import * as ColumnInfo from "./ColumnInfo";
import * as ColumnDesc from "./ColumnDesc";
import * as TestFunction from "./TestFunction";
import * as Util from "./Util";




export type CostFunction =
    (columnInfo: ColumnInfo.ColumnInfo) =>
        (constraint: Constraint.Constraint) =>
            (records: SourceRecordSet.SourceRecordSet) => number;


export type AppliedRecordSetCostFunction =
    (records: SourceRecordSet.SourceRecordSet) => number;



export const mapWeightToCost =
    (weight: Constraint.Weight) => {
        // Weight value check
        const $ = (w: Constraint.Weight) => weight === w;

        // Lookup
        if ($(0)) return 1000;      // "must have"
        if ($(1)) return 50;        // "should have"
        if ($(2)) return 10;        // "ideally has"
        if ($(3)) return 2;         // "could have"

        return Util.throwErr(new Error(`CostFunction: Unexpected constraint weight "${weight}"`))
    }

export const mapOperatorToCostFunction =
    (operator: Constraint.Operator) => {
        // Operator value check
        const $ = (op: Constraint.Operator) => operator === op;

        // Lookup
        if ($(0)) return Countable.Threshold.exactly;       // "exactly"
        if ($(1)) return Countable.Threshold.notExactly;    // "not exactly"
        if ($(2)) return Countable.Threshold.atLeast;       // "at least"
        if ($(3)) return Countable.Threshold.atMost;        // "at most"
        if ($(4)) return Countable.Limit.maximise;          // "as many as possible"
        if ($(5)) return Countable.Limit.minimise;          // "as few as possible"
        if ($(6)) return Similarity.similar;                // "as similar as possible"
        if ($(7)) return Similarity.different;              // "as different as possible"

        return Util.throwErr(new Error(`CostFunction: Unexpected constraint operator "${operator}"`))
    }

export namespace Countable {
    export namespace Threshold {
        type ThresholdFunction = (threshold: number) => (count: number) => boolean;

        export const costFunction =
            (thresholdFunc: ThresholdFunction) =>
                (testFunc: TestFunction.RecordTestFunction): CostFunction =>
                    (_columnInfo) =>
                        (constraint) =>
                            (records) => {
                                const testCount = TestFunction.countTestsOverRecords(records)(testFunc);

                                return thresholdFunc(Constraint.getCount(constraint))(testCount) ? 0 : mapWeightToCost(Constraint.getWeight(constraint));
                            }

        export const exactly = costFunction((threshold) => (count) => count === threshold);
        export const notExactly = costFunction((threshold) => (count) => count !== threshold);
        export const atLeast = costFunction((threshold) => (count) => count >= threshold);
        export const atMost = costFunction((threshold) => (count) => count <= threshold);
    }

    export namespace Limit {
        type CostBaseFunction = (size: number) => (count: number) => number;

        export const costFunction =
            (costBaseFunc: CostBaseFunction) =>
                (testFunc: TestFunction.RecordTestFunction): CostFunction =>
                    (_columnInfo) =>
                        (constraint) =>
                            (records) => {
                                const testCount = TestFunction.countTestsOverRecords(records)(testFunc);

                                return Math.pow(costBaseFunc(records.length)(testCount), 1.5) * mapWeightToCost(Constraint.getWeight(constraint));
                            }

        export const maximise = costFunction((size) => (count) => size - count);
        export const minimise = costFunction((_size) => (count) => count);
    }
}

export namespace Similarity {
    export const similar =
        (_testFunc: TestFunction.RecordTestFunction): CostFunction =>
            (columnInfo) =>
                (constraint) => {
                    const columnIndex = Constraint.getColumnIndex(constraint);
                    const columnDesc = ColumnInfo.get(columnInfo)(columnIndex);
                    const cost = mapWeightToCost(Constraint.getWeight(constraint));

                    if (ColumnDesc.isNumeric(columnDesc)) {
                        return (records) => {
                            if (!records.length) {
                                return 0;
                            }

                            const range = ColumnDesc.getRange(columnDesc);

                            // Get record values (numbers); drop any NaN values
                            const recordValues = records
                                .map(record => record[columnIndex])
                                .filter(val => !Util.isNaN(val));

                            return cost * 2 * Util.stdDev(recordValues) / range;
                        };
                    }

                    if (ColumnDesc.isString(columnDesc)) {
                        return (records) => {
                            if (!records.length) {
                                return 0;
                            }

                            // Get record values (numbers); drop any NaN values
                            const recordValues = records
                                .map(record => record[columnIndex])
                                .filter(val => !Util.isNaN(val));

                            // Create set of string pointers; determine size = number of distinct values
                            const distinctRecordValues = recordValues
                                .reduce((set, val) => {
                                    set.add(val);
                                    return set;
                                },
                                new Set<SourceRecord.Value>()
                                )
                                .size;

                            if (distinctRecordValues <= 1) {
                                return 0;
                            }

                            return cost * (distinctRecordValues - 1);
                        };
                    }

                    return Util.throwErr(new Error(`CostFunction: Unexpected column description type "${ColumnDesc.getType(columnDesc)}"`));
                }

    export const different =
        (_testFunc: TestFunction.RecordTestFunction): CostFunction =>
            (columnInfo) =>
                (constraint) => {
                    const columnIndex = Constraint.getColumnIndex(constraint);
                    const columnDesc = ColumnInfo.get(columnInfo)(columnIndex);
                    const cost = mapWeightToCost(Constraint.getWeight(constraint));

                    if (ColumnDesc.isNumeric(columnDesc)) {
                        return (records) => {
                            if (!records.length) {
                                return 0;
                            }

                            const range = ColumnDesc.getRange(columnDesc);

                            // Get record values (numbers); drop any NaN values
                            const recordValues = records
                                .map(record => record[columnIndex])
                                .filter(val => !Util.isNaN(val));

                            return cost * (range - 2 * Util.stdDev(recordValues)) / range;
                        };
                    }

                    if (ColumnDesc.isString(columnDesc)) {
                        return (records) => {
                            if (!records.length) {
                                return 0;
                            }

                            // Get record values (numbers); drop any NaN values
                            const recordValues = records
                                .map(record => record[columnIndex])
                                .filter(val => !Util.isNaN(val));

                            // Maximum number of different values is either the size of the input records or 
                            // the number of possible distinct values in the column
                            const maxPossibleValues = Math.min(records.length, ColumnDesc.getStringDistinct(columnDesc));

                            // Create set of string pointers; determine size = number of distinct values
                            const distinctRecordValues = recordValues
                                .reduce((set, val) => {
                                    set.add(val);
                                    return set;
                                },
                                new Set<SourceRecord.Value>()
                                )
                                .size;

                            return cost * (maxPossibleValues - distinctRecordValues);
                        };
                    }

                    return Util.throwErr(new Error(`CostFunction: Unexpected column description type "${ColumnDesc.getType(columnDesc)}"`));
                }
}

export const generateAppliedRecordSetCostFunctions =
    (columnInfo: ColumnInfo.ColumnInfo) =>
        (constraints: Constraint.Constraint[]): AppliedRecordSetCostFunction[] => {
            return constraints.map(
                (constraint) => {
                    const operator = Constraint.getOperator(constraint);
                    const columnIndex = Constraint.getColumnIndex(constraint);

                    // Work out record test function by type
                    let recordTestFunc: TestFunction.RecordTestFunction;

                    if (Constraint.isCountable(constraint)) {
                        const targetValue = Constraint.getFieldValue(constraint);
                        const fieldOperator = Constraint.getFieldOperator(constraint);

                        // Get the record value test function
                        const recordValueTestFunc = TestFunction.mapFieldOperatorToRecordValueTestFunction(fieldOperator);
                        recordTestFunc = TestFunction.testRecord(recordValueTestFunc)(targetValue)(columnIndex);

                    } else if (Constraint.isSimilarity(constraint)) {
                        // recordTestFunc is ignored for similarity constraints
                        recordTestFunc = _ => true;

                    } else {
                        return Util.throwErr(new Error(`CostFunction: Unexpected constraint type`));
                    }

                    // Get the cost function for the "operator"; apply record test func
                    const costFunction = mapOperatorToCostFunction(operator)(recordTestFunc);

                    // Return the cost function for a set of records
                    return costFunction(columnInfo)(constraint);
                });
        }

export const getCostUsingAppliedRecordSetCostFunctions =
    (appliedRecordSetCostFunctions: AppliedRecordSetCostFunction[]) =>
        (records: SourceRecordSet.SourceRecordSet) => {
            return appliedRecordSetCostFunctions.reduce(
                (cost, costFunc) => {
                    return cost + costFunc(records);
                },
                0
            );
        }
