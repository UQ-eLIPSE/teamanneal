/*
 * Constraint
 * 
 * 
 */
import * as Config from "./Config";
import * as StringMap from "./StringMap";

import * as Util from "../core/Util"; 



export interface Constraint extends
    Array<number | Weight | Operator | CountableFieldOperator | StringMap.StringPointer> {
    /// Standard
        /** level */            0: number,
        /** weight */           1: Weight,
        /** field */            2: number,  // Header index = ith column
        /** operator */         3: Operator,

    /// Special
        /** of-size */          4: number,

    /// Countable constraints
        /** field-operator */   5: CountableFieldOperator,
        /** field-value */      6: number | StringMap.StringPointer,

        /** count */            7: number,
}

export const __size: number = 8;

// TODO: Why doesn't TypeScript associate number[] to Constraint?
const __seed: Constraint = Util.initArray(NaN)(__size) as any;



export type EnumPointer = number;

export enum Weight {
    "must have",                    // 0
    "should have",                  // 1
    "ideally has",                  // 2
    "could have",                   // 3
}

export enum Operator {
    // CountableThreshold
    "exactly",                      // 0
    "not exactly",                  // 1
    "at least",                     // 2
    "at most",                      // 3

    // CountableLimit
    "as many as possible",          // 4
    "as few as possible",           // 5

    // Similarity
    "as similar as possible",       // 6
    "as different as possible",     // 7
}

export enum CountableFieldOperator {
    "equal to",                     // 0
    "not equal to",                 // 1
    "less than or equal to",        // 2
    "less than",                    // 3
    "greater than or equal to",     // 4
    "greater than",                 // 5
}




const __getter = <T>(i: number) => (c: Constraint): T => (c as any)[i];
const __setter = <T>(i: number) => (c: Constraint) => (val: T): T => (c as any)[i] = val;

export const getLevel = __getter<number>(0);
export const getWeight = __getter<Weight>(1);
export const getField = __getter<number>(2);
export const getOperator = __getter<Operator>(3);
export const getOfSize = __getter<number>(4);
export const getFieldOperator = __getter<CountableFieldOperator>(5);
export const getFieldValue = __getter<number | StringMap.StringPointer>(6);
export const getCount = __getter<number>(7);

export const getColumnIndex = getField;

export const setLevel = __setter<number>(0);
export const setWeight = __setter<Weight>(1);
export const setField = __setter<number>(2);
export const setOperator = __setter<Operator>(3);
export const setOfSize = __setter<number>(4);
export const setFieldOperator = __setter<CountableFieldOperator>(5);
export const setFieldValue = __setter<number | StringMap.StringPointer>(6);
export const setCount = __setter<number>(7);

export const setColumnIndex = setField;

export const init =
    (): Constraint => {
        // Copy seed array
        return __seed.slice() as any;
    }

export const initFromConfigConstraint =
    (stringMap: StringMap.StringMap) =>
        (headers: string[]) =>
            (configConstraint: Config.Constraint) => {
                const constraint = init();

                // Standard props
                setLevel(constraint)(configConstraint.level);
                setWeight(constraint)(
                    convertConfigConstraintWeight(configConstraint.weight)
                );

                const columnIndex = headers.indexOf(configConstraint.field);

                if (columnIndex < 0) {
                    return Util.throwErr(new Error(`Constraint: Unexpected header "${configConstraint.field}" in constraint`));
                }

                setColumnIndex(constraint)(columnIndex);
                setOperator(constraint)(
                    convertConfigConstraintOperator(configConstraint.operator)
                );

                // Special
                const ofSize = configConstraint["of-size"];
                if (typeof ofSize !== "undefined") {
                    setOfSize(constraint)(ofSize);
                }

                // Types of constraint
                if (isConfigConstraintCountableThreshold(configConstraint)) {

                    setFieldOperator(constraint)(
                        convertConfigConstraintCountableFieldOperator(configConstraint["field-operator"])
                    );

                    const fieldValue = configConstraint["field-value"];
                    setFieldValue(constraint)(
                        typeof fieldValue === "string" ?
                            StringMap.add(stringMap)(fieldValue) :
                            fieldValue
                    );

                    setCount(constraint)(configConstraint.count);

                } else if (isConfigConstraintCountableLimit(configConstraint)) {

                    setFieldOperator(constraint)(
                        convertConfigConstraintCountableFieldOperator(configConstraint["field-operator"])
                    );

                    const fieldValue = configConstraint["field-value"];
                    setFieldValue(constraint)(
                        typeof fieldValue === "string" ?
                            StringMap.add(stringMap)(fieldValue) :
                            fieldValue
                    );

                } else if (isConfigConstraintSimilarity(configConstraint)) {

                    // Already covered

                } else {

                    Util.throwErr(new Error("Constraint: Unknown constraint type"));

                }

                return constraint;
            }




export const isCountableThreshold =
    (c: Constraint) => {
        const operator = getOperator(c);
        return operator < 4;    // Dependent on order of enum
    }

export const isCountableLimit =
    (c: Constraint) => {
        const operator = getOperator(c);
        return operator > 3 && operator < 6;    // Dependent on order of enum
    }

export const isCountable =
    (c: Constraint) => isCountableThreshold(c) || isCountableLimit(c);

export const isSimilarity =
    (c: Constraint) => {
        const operator = getOperator(c);
        return operator > 5;    // Dependent on order of enum
    }


export const convertConfigConstraintWeight =
    (weight: Config.ConstraintWeight) => {
        return Weight[weight];
    }

export const convertConfigConstraintOperator =
    (operator: Config.ConstraintOperator) => {
        return Operator[operator];
    }

export const convertConfigConstraintCountableFieldOperator =
    (operator: Config.ConstraintCountableFieldOperator) => {
        return CountableFieldOperator[operator];
    }

export const isConfigConstraintCountableThreshold =
    (configConstraint: Config.Constraint): configConstraint is Config.ConstraintCountableThreshold => {
        switch (configConstraint.operator) {
            case "exactly":
            case "not exactly":
            case "at least":
            case "at most":
                return true;
        }

        return false;
    }

export const isConfigConstraintCountableLimit =
    (configConstraint: Config.Constraint): configConstraint is Config.ConstraintCountableLimit => {
        switch (configConstraint.operator) {
            case "as many as possible":
            case "as few as possible":
                return true;
        }

        return false;
    }

export const isConfigConstraintSimilarity =
    (configConstraint: Config.Constraint): configConstraint is Config.ConstraintSimilarity => {
        switch (configConstraint.operator) {
            case "as similar as possible":
            case "as different as possible":
                return true;
        }

        return false;
    }
