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
    private recordSatisfactionArray: Uint8Array;

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

        // Store satisfaction
        this.recordSatisfactionArray = recordSatisfactionArray;
    }

    public calculateUnweightedCost(recordPointers: Set<number>) {
        let count: number = 0;
        const constraintDef = this.constraintDef;
        const recordSatisfactionArray = this.recordSatisfactionArray;

        if (constraintDef.type !== "count") {
            throw new Error("Expected count constraint definition");
        }

        // Count the number of records which satisifed the filter
        recordPointers.forEach((recordPointer) => {
            // Increment count if record satisfies filter
            if (recordSatisfactionArray[recordPointer] === TRUE) {
                ++count;
            }
        });

        // Run condition cost function 
        return CountConstraint.computeConditionCost(constraintDef.condition.function, constraintDef.condition.value, count);
    }

    private static computeConditionCost(fn: string, reference: number, count: number) {
        switch (fn) {
            case "eq": return count === reference ? 1 : 0;
            case "neq": return count !== reference ? 1 : 0;
            case "lt": return count < reference ? 1 : 0;
            case "lte": return count <= reference ? 1 : 0;
            case "gt": return count > reference ? 1 : 0;
            case "gte": return count >= reference ? 1 : 0;
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
