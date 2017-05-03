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

import * as Util from "../core/Util"; 



export type CostFunction =
    (columnInfo: ColumnInfo.ColumnInfo) =>
        (constraint: Constraint.Constraint) =>
            (records: SourceRecordSet.SourceRecordSet) => number;


export type AppliedRecordSetCostFunction =
    (records: SourceRecordSet.SourceRecordSet) => number;


export type SatisfactionTestFunction =
    (columnInfo: ColumnInfo.ColumnInfo) =>
        (constraint: Constraint.Constraint) =>
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

                            if (range === 0) {
                                // Constraint met if range = 0
                                return 0;
                            }

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

                            if (range === 0) {
                                // Constraint not met if range = 0
                                return cost;
                            }

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
                    const costFunction = getUnappliedCostFunction(constraint);

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

export const getRecordTestFunction =
    (constraint: Constraint.Constraint): TestFunction.RecordTestFunction => {
        // Work out record test function by type

        if (Constraint.isCountable(constraint)) {
            const columnIndex = Constraint.getColumnIndex(constraint);
            const targetValue = Constraint.getFieldValue(constraint);
            const fieldOperator = Constraint.getFieldOperator(constraint);

            // Get the record value test function
            const recordValueTestFunc = TestFunction.mapFieldOperatorToRecordValueTestFunction(fieldOperator);
            return TestFunction.testRecord(recordValueTestFunc)(targetValue)(columnIndex);
        }

        if (Constraint.isSimilarity(constraint)) {
            // recordTestFunc is ignored for similarity constraints
            return _ => true;
        }

        return Util.throwErr(new Error(`CostFunction: Unexpected constraint type`));
    }

export const getUnappliedCostFunction =
    (constraint: Constraint.Constraint) => {
        const operator = Constraint.getOperator(constraint);
        const recordTestFunc = getRecordTestFunction(constraint);

        // Get the cost function for the "operator"; apply record test func
        return mapOperatorToCostFunction(operator)(recordTestFunc);
    }

/**
 * Maps a given operator to an appropriate satisfaction test function.
 * 
 * Satisfaction tests give a score between [0, 1] that indicate the level of
 * satisfaction of a given constraint over a set of records.
 * 
 * @param operator
 */
export const mapOperatorToSatisfactionTest =
    (operator: Constraint.Operator): SatisfactionTestFunction => {
        switch (operator) {
            case 0:     // "exactly"
            case 1:     // "not exactly"
            case 2:     // "at least"
            case 3:     // "at most"
                return (columnInfo) =>
                    (constraint) =>
                        (records) => {
                            // Run function, check cost
                            const costFunction = getUnappliedCostFunction(constraint);
                            const cost = costFunction(columnInfo)(constraint)(records);

                            if (cost === 0) {
                                return 1;
                            } else {
                                return 0;
                            }
                        }


            case 4:     // "as many as possible"
                return (_columnInfo) =>
                    (constraint) =>
                        (records) => {
                            // Get the inner record test function, and
                            // check how many records in record set
                            // satisfy condition
                            const testFunc = getRecordTestFunction(constraint);
                            const count = TestFunction.countTestsOverRecords(records)(testFunc);
                            const numOfRecords = records.length;

                            if (numOfRecords > 0) {
                                return count / records.length;
                            } else {
                                return 1;
                            }
                        }


            case 5:     // "as few as possible"
                return (_columnInfo) =>
                    (constraint) =>
                        (records) => {
                            // Get the inner record test function, and
                            // check how many records in record set
                            // satisfy condition
                            const testFunc = getRecordTestFunction(constraint);
                            const count = TestFunction.countTestsOverRecords(records)(testFunc);
                            const numOfRecords = records.length;

                            if (numOfRecords > 0) {
                                return 1 - (count / records.length);
                            } else {
                                return 1;
                            }
                        }


            case 6:     // "as similar as possible"
                return (columnInfo) =>
                    (constraint) => {
                        const columnIndex = Constraint.getColumnIndex(constraint);
                        const columnDesc = ColumnInfo.get(columnInfo)(columnIndex);

                        if (ColumnDesc.isNumeric(columnDesc)) {
                            return (records) => {
                                if (!records.length) {
                                    return 1;   // No diversity to check
                                }

                                const range = ColumnDesc.getRange(columnDesc);

                                // Get record values (numbers); drop any NaN values
                                const recordValues = records
                                    .map(record => record[columnIndex])
                                    .filter(val => !Util.isNaN(val));

                                if (range === 0) {
                                    return 1;   // Constraint met
                                } else if (Util.stdDev(recordValues) / range < 0.1) {
                                    return 1;   // We'll consier the constraint met
                                } else {
                                    return 0;
                                }
                            };
                        }

                        if (ColumnDesc.isString(columnDesc)) {
                            return (records) => {
                                // Run function, check cost
                                const costFunction = getUnappliedCostFunction(constraint);
                                const cost = costFunction(columnInfo)(constraint)(records);

                                if (cost === 0) {
                                    return 1;
                                } else {
                                    return 0;
                                }
                            };
                        }

                        return Util.throwErr(new Error(`CostFunction: Unexpected column description type "${ColumnDesc.getType(columnDesc)}"`));
                    }

            case 7:     // "as different as possible"
                return (columnInfo) =>
                    (constraint) => {
                        const columnIndex = Constraint.getColumnIndex(constraint);
                        const columnDesc = ColumnInfo.get(columnInfo)(columnIndex);

                        if (ColumnDesc.isNumeric(columnDesc)) {
                            return (records) => {
                                if (!records.length) {
                                    return 1;   // No diversity to check
                                }

                                const range = ColumnDesc.getRange(columnDesc);

                                // Get record values (numbers); drop any NaN values
                                const recordValues = records
                                    .map(record => record[columnIndex])
                                    .filter(val => !Util.isNaN(val));

                                if (range === 0) {
                                    return 0;   // Constraint **not** met
                                } else if (Util.stdDev(recordValues) / range > 0.25) {
                                    return 1;   // Consider constraint met
                                } else {
                                    return 0;
                                }
                            };
                        }

                        if (ColumnDesc.isString(columnDesc)) {
                            return (records) => {
                                // Run function, check cost
                                const costFunction = getUnappliedCostFunction(constraint);
                                const cost = costFunction(columnInfo)(constraint)(records);

                                if (cost === 0) {
                                    return 1;
                                } else {
                                    return 0;
                                }
                            };
                        }

                        return Util.throwErr(new Error(`CostFunction: Unexpected column description type "${ColumnDesc.getType(columnDesc)}"`));
                    }
        }

        return Util.throwErr(new Error(`CostFunction: Unexpected constraint operator "${operator}"`))
    }

export const generateAppliedRecordSetSatisfactionTests =
    (columnInfo: ColumnInfo.ColumnInfo) =>
        (constraints: Constraint.Constraint[]): AppliedRecordSetCostFunction[] => {
            return constraints.map(
                (constraint) => {
                    const operator = Constraint.getOperator(constraint);
                    const satisfactionTest = mapOperatorToSatisfactionTest(operator);

                    // Return the satisfaction test for a set of records
                    return satisfactionTest(columnInfo)(constraint);
                });
        }
