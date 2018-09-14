import { AbstractConstraint } from "./AbstractConstraint";

import * as Record from "../../../common/Record";

// Boolean equivalent values for use in the Uint8Array
const FALSE: number = 0;
const TRUE: number = 1;

export class LimitConstraint extends AbstractConstraint {
    /** 
     * An array of boolean values {0=false, 1=true} for each record element's
     * satisfaction of the condition function
     */
    private recordSatisfactionArray!: Uint8Array;

    private constraintConditionCostFunction!: (setSize: number, count: number) => number;

    protected init(records: Record.RecordSet) {
        // Initialise record array
        const recordSatisfactionArray = new Uint8Array(records.length);

        // Get information about this constraint
        const constraintDef = this.constraintDef;

        if (constraintDef.type !== "limit") {
            throw new Error("Expected limit constraint definition");
        }

        const colIndex = constraintDef.filter.column;
        const filterFn = constraintDef.filter.function;

        // TODO: We currently only support one value to filter over
        const filterSearchValue = constraintDef.filter.values[0];

        if (filterSearchValue === undefined || filterSearchValue === null) {
            throw new Error("Filter search value must be defined and not null");
        }

        // Generate the filter function
        const filterFunction = LimitConstraint.generateFilterFunction(filterFn, filterSearchValue);

        // Run filter function on the record ahead-of-time
        for (let recordIndex = 0; recordIndex < records.length; ++recordIndex) {
            const record = records[recordIndex];
            const recordElement = record[colIndex];

            // We store the satisfaction as a boolean-equivalent value in a
            // Uint8Array
            let satisfaction: number;

            if (recordElement !== null && filterFunction(recordElement)) {
                satisfaction = TRUE;
            } else {
                satisfaction = FALSE;
            }

            recordSatisfactionArray[recordIndex] = satisfaction;
        }

        // Store to this object
        this.recordSatisfactionArray = recordSatisfactionArray;
        this.constraintConditionCostFunction = LimitConstraint.generateConditionCostFunction(constraintDef.condition.function);
    }

    public calculateUnweightedCost(recordPointers: Uint32Array) {
        // Count the number of records which satisifed the filter
        const count = this.countFilterSatisfyingRecords(recordPointers);

        // Run condition cost function 
        return this.constraintConditionCostFunction(recordPointers.length, count);
    }

    public countFilterSatisfyingRecords(recordPointers: Uint32Array) {
        let count: number = 0;

        // Count the number of records which satisifed the filter
        for (let i = 0; i < recordPointers.length; ++i) {
            const recordPointer = recordPointers[i];
            // Increment count if record satisfies filter
            if (this.recordSatisfactionArray[recordPointer] === TRUE) {
                ++count;
            }
        }

        return count;
    }

    /** Used to speed up the heavily repeated (x ** 1.5) calculations */
    private static pow_1_5_cache: { [key: number]: number | undefined } = {};

    private static pow_1_5(x: number) {
        const result = LimitConstraint.pow_1_5_cache[x];

        if (result === undefined) {
            return (LimitConstraint.pow_1_5_cache[x] = Math.pow(x, 1.5));
        }

        return result;
    }

    private static generateConditionCostFunction(fn: string) {
        switch (fn) {
            case "low": return (_setSize: number, count: number) => LimitConstraint.pow_1_5(count);
            case "high": return (setSize: number, count: number) => LimitConstraint.pow_1_5(setSize - count);
        }

        throw new Error("Unknown limit constraint condition function");
    }

    private static generateFilterFunction(fn: string, reference: string | number) {
        switch (fn) {
            case "eq": return (el: string | number) => el === reference;
            case "neq": return (el: string | number) => el !== reference;
            case "lt": return (el: string | number) => el < reference;
            case "lte": return (el: string | number) => el <= reference;
            case "gt": return (el: string | number) => el > reference;
            case "gte": return (el: string | number) => el >= reference;
        }

        throw new Error("Unknown filter function");
    }
}
