import { AbstractConstraint } from "./AbstractConstraint";

import * as Record from "../../../common/Record";

// Boolean equivalent values for use in the Uint8Array
const FALSE: number = 0;
const TRUE: number = 1;

export class CountConstraint extends AbstractConstraint {
    /** 
     * An array of boolean values {0=false, 1=true} for each record element's
     * satisfaction of the condition function
     */
    private recordSatisfactionArray!: Uint8Array;

    private constraintConditionSatisfactionFunction!: (count: number) => boolean;

    protected init(records: Record.RecordSet) {
        // Initialise record array
        const recordSatisfactionArray = new Uint8Array(records.length);

        // Get information about this constraint
        const constraintDef = this.constraintDef;

        if (constraintDef.type !== "count") {
            throw new Error("Expected count constraint definition");
        }

        const colIndex = constraintDef.filter.column;
        const filterFn = constraintDef.filter.function;

        // TODO: We currently only support one value to filter over
        const filterSearchValue = constraintDef.filter.values[0];

        if (filterSearchValue === undefined || filterSearchValue === null) {
            throw new Error("Filter search value must be defined and not null");
        }

        // Generate the filter function
        const filterFunction = CountConstraint.generateFilterFunction(filterFn, filterSearchValue);

        // Run filter function on the record ahead-of-time
        for (let recordIndex = 0; recordIndex < records.length; ++recordIndex) {
            const record = records[recordIndex];
            const recordElement = record[colIndex];

            // We store the satisfaction as a boolean-equivalent value in a
            // Uint8Array
            let satisfaction: number;

            if (filterSearchValue !== null && recordElement !== null && filterFunction(recordElement)) {
                satisfaction = TRUE;
            } else {
                satisfaction = FALSE;
            }

            recordSatisfactionArray[recordIndex] = satisfaction;
        }

        // Store to this object
        this.recordSatisfactionArray = recordSatisfactionArray;
        this.constraintConditionSatisfactionFunction = CountConstraint.generateConditionSatisfactionFunction(constraintDef.condition.function, constraintDef.condition.value);
    }

    public calculateUnweightedCost(recordPointers: Uint32Array) {
        // Count the number of records which satisifed the filter
        const count = this.countFilterSatisfyingRecords(recordPointers);

        // Run condition satisfaction function 
        const isConditionSatisfied = this.constraintConditionSatisfactionFunction(count);

        if (isConditionSatisfied) {
            return 0;   // Cost is 0 when satisfied
        } else {
            return 1;   // Cost is max when not satisfied
        }
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

    private static generateConditionSatisfactionFunction(fn: string, reference: number) {
        switch (fn) {
            case "eq": return (count: number) => count === reference;
            case "neq": return (count: number) => count !== reference;
            case "lt": return (count: number) => count < reference;
            case "lte": return (count: number) => count <= reference;
            case "gt": return (count: number) => count > reference;
            case "gte": return (count: number) => count >= reference;
        }

        throw new Error("Unknown count constraint condition function");
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
