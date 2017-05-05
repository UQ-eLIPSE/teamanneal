import * as Record from "../../../common/Record";

import * as Util from "../core/Util";

export type CostFunction =
    BooleanCost |
    LimitCost |
    NumberSimilarityCost |
    StringSimilarityCost;

/** 
 * Function that returns [0, 1] where 0 cost is achieved when condition is true.
 */
export type BooleanCost = (targetValue: Record.RecordElement, inputValue: Record.RecordElement) => number;
/**
 * Function that returns a positive integer that is proportionate to cost
 * calculated for a limit to the target value.
 */
export type LimitCost = (targetValue: number, inputValue: number) => number;
/**
 * Function that returns a number that is proportionate to cost calculated for
 * the known range of numbers in a column 
 */
export type NumberSimilarityCost = (columnRange: number, values: ReadonlyArray<number>) => number;
/**
 * Function that returns a number that is proportionate to the cost 
 */
export type StringSimilarityCost = (maxDistinctValues: number, distinctValuesInSet: number) => number;


/**
 * Converts boolean value to cost.
 * 
 * If boolean is true; cost is 0 because there should be no cost when condition
 * is satisfied.
 * If boolean is false; cost is 1.
 */
function boolToCost(boolean: boolean) {
    return boolean ? 0 : 1;
}

export const eq: BooleanCost = (targetValue, inputValue) => boolToCost(inputValue === targetValue);
export const neq: BooleanCost = (targetValue, inputValue) => boolToCost(inputValue !== targetValue);
export const lt: BooleanCost = (targetValue, inputValue) => boolToCost((inputValue || 0) < (targetValue || 0));
export const gt: BooleanCost = (targetValue, inputValue) => boolToCost((inputValue || 0) > (targetValue || 0));
export const lte: BooleanCost = (targetValue, inputValue) => boolToCost((inputValue || 0) <= (targetValue || 0));
export const gte: BooleanCost = (targetValue, inputValue) => boolToCost((inputValue || 0) >= (targetValue || 0));

export const low: LimitCost = (_targetValue, inputValue) => inputValue;
export const high: LimitCost = (targetValue, inputValue) => targetValue - inputValue;

export const numberSimilar: NumberSimilarityCost = (columnRange, values) => {
    // Zero cost incurred if there is no range in the column
    if (columnRange === 0) {
        return 0;
    }

    return (2 * Util.stdDev(values)) / columnRange;
};
export const numberDifferent: NumberSimilarityCost = (columnRange, values) => {
    // Zero cost incurred if there is no range in the column
    if (columnRange === 0) {
        return 0;
    }

    return (columnRange - 2 * Util.stdDev(values)) / columnRange;
};

export const stringSimilar: StringSimilarityCost = (_maxDistinctValues, distinctValuesInSet) => {
    // Cost = 0 when there is only one value
    if (distinctValuesInSet === 1) {
        return 0;
    }

    return distinctValuesInSet - 1;
};
export const stringDifferent: StringSimilarityCost = (maxDistinctValues, distinctValuesInSet) => {
    return maxDistinctValues - distinctValuesInSet;
}
