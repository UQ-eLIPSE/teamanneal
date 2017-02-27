import * as Config from "./Config";
import * as SourceRecord from "./SourceRecord";

import * as Constraint from "./Constraint";
import * as ColumnInfo from "./ColumnInfo";

import * as Group from "./Group";

import * as TestFunction from "./TestFunction";
import * as Util from "./Util";




export type CostFunction<T extends Constraint.Constraint<Config.ConstraintBase>> =
    (constraint: T) =>
        (records: SourceRecord.Set) => number;


export const mapWeightToCost =
    (weight: Config.ConstraintWeight) => {
        switch (weight) {
            case "must have":
                return 1000;
            case "should have":
                return 50;
            case "ideally has":
                return 10;
            case "could have":
                return 2;
        }

        throw new Error(`Unexpected constraint weight "${weight}"`);
    }

export const mapCountableThresholdOperatorToCostFunction =
    (operator: Config.ConstraintCountableThresholdOperator) => {
        switch (operator) {
            case "exactly":
                return Countable.Threshold.exactly;
            case "not exactly":
                return Countable.Threshold.notExactly;
            case "at least":
                return Countable.Threshold.atLeast;
            case "at most":
                return Countable.Threshold.atMost;
        }

        throw new Error(`Unexpected countable constraint threshold operator "${operator}"`);
    }

export const mapCountableLimitOperatorToCostFunction =
    (operator: Config.ConstraintCountableLimitOperator) => {
        switch (operator) {
            case "as many as possible":
                return Countable.Limit.maximise;
            case "as few as possible":
                return Countable.Limit.maximise;
        }

        throw new Error(`Unexpected countable constraint limit operator "${operator}"`);
    }

export const mapSimilarityTypeOperatorToCostFunction =
    (type: "number" | "string") =>
        (operator: Config.ConstraintSimilarityOperator) => {
            switch (type) {
                case "number": {
                    switch (operator) {
                        case "as similar as possible":
                            return Similarity.Number.similar;
                        case "as different as possible":
                            return Similarity.Number.different;
                    }

                    throw new Error(`Unexpected similarity constraint operator "${operator}"`);
                }

                case "string": {
                    switch (operator) {
                        case "as similar as possible":
                            return Similarity.String.similar;
                        case "as different as possible":
                            return Similarity.String.different;
                    }

                    throw new Error(`Unexpected similarity constraint operator "${operator}"`);
                }
            }

            throw new Error(`Unexpected similarity constraint type "${type}"`);
        }

export namespace Countable {
    export namespace Threshold {
        type Constraint = Constraint.Constraint<Config.ConstraintCountableThreshold>;
        type ThresholdFunction = (threshold: number) => (count: number) => boolean;

        export const costFunction =
            (thresholdFunc: ThresholdFunction) =>
                (testFunc: TestFunction.RecordTestFunction): CostFunction<Constraint> =>
                    (constraint) =>
                        (records) => {
                            const testCount = TestFunction.countTestsOverRecords(records)(testFunc);

                            return thresholdFunc(constraint.description.count)(testCount) ? 0 : mapWeightToCost(constraint.description.weight);
                        }

        export const exactly = costFunction((threshold) => (count) => count === threshold);
        export const notExactly = costFunction((threshold) => (count) => count !== threshold);
        export const atLeast = costFunction((threshold) => (count) => count >= threshold);
        export const atMost = costFunction((threshold) => (count) => count <= threshold);
    }

    export namespace Limit {
        type Constraint = Constraint.Constraint<Config.ConstraintCountableLimit>;
        type CostBaseFunction = (size: number) => (count: number) => number;

        export const costFunction =
            (costBaseFunc: CostBaseFunction) =>
                (testFunc: TestFunction.RecordTestFunction): CostFunction<Constraint> =>
                    (constraint) =>
                        (records) => {
                            const testCount = TestFunction.countTestsOverRecords(records)(testFunc);

                            return Math.pow(costBaseFunc(records.length)(testCount), 1.5) * mapWeightToCost(constraint.description.weight);
                        }

        export const maximise = costFunction((size) => (count) => size - count);
        export const minimise = costFunction((_size) => (count) => count);
    }
}

export namespace Similarity {
    type Constraint = Constraint.Constraint<Config.ConstraintSimilarity>;

    export namespace Number {
        export const similar: CostFunction<Constraint> =
            (constraint) =>
                (records) => {
                    if (!records.length) {
                        return 0;
                    }

                    if (!ColumnInfo.isNumeric(constraint.columnInfo)) {
                        throw new Error("Column not numeric");
                    }

                    const range = constraint.columnInfo.range.max - constraint.columnInfo.range.min;
                    const column = constraint.description.field;

                    // Number casting is done regardless because blank strings may appear
                    const recordValues = records.map(record => +(SourceRecord.getRecordValue(record)(column) || 0));
                    return mapWeightToCost(constraint.description.weight) * 2 * Util.stdDev(recordValues) / range;
                }

        export const different: CostFunction<Constraint> =
            (constraint) =>
                (records) => {
                    if (!records.length) {
                        return 0;
                    }

                    if (!ColumnInfo.isNumeric(constraint.columnInfo)) {
                        throw new Error("Column not numeric");
                    }

                    const range = constraint.columnInfo.range.max - constraint.columnInfo.range.min;
                    const column = constraint.description.field;

                    // Number casting is done regardless because blank strings may appear
                    const recordValues = records.map(record => +(SourceRecord.getRecordValue(record)(column) || 0));
                    return mapWeightToCost(constraint.description.weight) * (range - 2 * Util.stdDev(recordValues)) / range;
                }
    }

    export namespace String {
        export const similar: CostFunction<Constraint> =
            (constraint) =>
                (records) => {
                    const column = constraint.description.field;
                    const distinctRecordValues = ColumnInfo.getColumnValueSet(records)(column).size;

                    if (distinctRecordValues <= 1) {
                        return 0;
                    }

                    return (distinctRecordValues - 1) * mapWeightToCost(constraint.description.weight);
                }

        export const different: CostFunction<Constraint> =
            (constraint) =>
                (records) => {
                    if (!records.length) {
                        return 0;
                    }

                    if (!ColumnInfo.isString(constraint.columnInfo)) {
                        throw new Error("Column not string");
                    }

                    const column = constraint.description.field;
                    const distinctRecordValues = ColumnInfo.getColumnValueSet(records)(column).size;

                    const maxPossibleValues = Math.min(records.length, constraint.columnInfo.distinctValues);

                    return (maxPossibleValues - distinctRecordValues) * mapWeightToCost(constraint.description.weight);
                }
    }

}







export const calculateCostOfGroup =
    (constraints: ReadonlyArray<Constraint.Constraint<Config.Constraint>>) =>
        (group: Group.Group) => {
            const records = group.records;

            return constraints.reduce(
                (cost, constraint) => {
                    if (Constraint.isConstraintCountableThreshold(constraint)) {
                        // Pull in the info we need for costing
                        const targetValue = constraint.description["field-value"];
                        const column = constraint.description.field;

                        // Get the record value test function
                        const recordValueTestOp = constraint.description["field-operator"];
                        const recordValueTestFunc = TestFunction.mapFieldOperatorToRecordValueTestFunction(recordValueTestOp);
                        const recordTestFunc = TestFunction.testRecord(recordValueTestFunc)(targetValue)(column);

                        // Get the cost function for the "operator"; apply record test func
                        const costFunction = mapCountableThresholdOperatorToCostFunction(constraint.description.operator)(recordTestFunc);

                        // Calculate the cost
                        const thisCost = costFunction(constraint)(records);

                        return cost + thisCost;
                    }

                    if (Constraint.isConstraintCountableLimit(constraint)) {
                        // Pull in the info we need for costing
                        const targetValue = constraint.description["field-value"];
                        const column = constraint.description.field;

                        // Get the record value test function
                        const recordValueTestOp = constraint.description["field-operator"];
                        const recordValueTestFunc = TestFunction.mapFieldOperatorToRecordValueTestFunction(recordValueTestOp);
                        const recordTestFunc = TestFunction.testRecord(recordValueTestFunc)(targetValue)(column);

                        // Get the cost function for the "operator"; apply record test func
                        const costFunction = mapCountableLimitOperatorToCostFunction(constraint.description.operator)(recordTestFunc);

                        // Calculate the cost
                        const thisCost = costFunction(constraint)(records);

                        return cost + thisCost;
                    }

                    if (Constraint.isConstraintSimilarity(constraint)) {
                        // Pull in the info we need for costing
                        const type = constraint.columnInfo.type;

                        // Get the cost function for the "operator"
                        const costFunction = mapSimilarityTypeOperatorToCostFunction(type)(constraint.description.operator);

                        // Calculate the cost
                        const thisCost = costFunction(constraint)(records);

                        return cost + thisCost;
                    }

                    throw new Error("Unexpected constraint type");
                },
                0
            );
        }