import { AbstractConstraint } from "./AbstractConstraint";

import * as Record from "../../../common/Record";

import * as Util from "../core/Util";

export class SimilarityNumericConstraint extends AbstractConstraint {
    /** 
     * An array of actual numeric values for each record element.
     * 
     * A `NaN` stored in this array indicates the lack of data at this element
     * in the original record.
     */
    private recordValueArray: Float64Array;

    private constraintConditionCostFunction: (columnRange: number, values: ReadonlyArray<number>) => number;
    private columnRange: number;

    protected init(records: Record.RecordSet) {
        // Initialise record array
        const recordValueArray = new Float64Array(records.length);

        // Get information about this constraint
        const constraintDef = this.constraintDef;
        const columnInfo = this.columnInfo;

        if (constraintDef.type !== "similarity") {
            throw new Error("Expected similarity constraint definition");
        }

        if (columnInfo.type !== "number") {
            throw new Error("Expected numeric column type");
        }

        const colIndex = constraintDef.filter.column;

        // Copy out all column numeric values
        for (let recordIndex = 0; recordIndex < records.length; ++recordIndex) {
            const record = records[recordIndex];
            const recordElement = record[colIndex];

            // Forbid strings
            if (typeof recordElement === "string") {
                throw new Error("String record element not acceptable for numeric constraint");
            }

            // Nulls are converted to NaNs for internal use to signal a number
            // that cannot be used in comparisons
            if (recordElement === null) {
                recordValueArray[recordIndex] = Number.NaN;
            } else {
                recordValueArray[recordIndex] = recordElement;
            }
        }

        // Store to this object
        this.recordValueArray = recordValueArray;
        this.constraintConditionCostFunction = SimilarityNumericConstraint.generateConditionCostFunction(constraintDef.condition.function);
        this.columnRange = columnInfo.range;
    }

    public calculateUnweightedCost(recordPointers: Uint32Array) {
        // If the column of values has no range (all same) = free of cost
        const columnRange = this.columnRange;

        if (columnRange === 0) {
            return 0;
        }

        // Get record values (numbers); drop any NaN values
        const values = this.getValues(recordPointers);

        // No data to process = free of cost
        if (values.length === 0) {
            return 0;
        }

        // Run condition cost function 
        let cost = this.constraintConditionCostFunction(columnRange, values);

        // Costs cannot be negative; floor at 0
        if (cost < 0) {
            cost = 0;
        }

        return cost;
    }

    public getValues(recordPointers: Uint32Array) {
        // Get record values (numbers); drop any NaN values as they represent
        // empty elements
        const values: number[] = [];

        for (let i = 0; i < recordPointers.length; ++i) {
            const recordPointer = recordPointers[i];
            const value = this.recordValueArray[recordPointer];

            // Ignore NaNs
            if (Number.isNaN(value)) { continue; }

            values.push(value);
        }

        return values as ReadonlyArray<number>;
    }

    private static generateConditionCostFunction(fn: string) {
        switch (fn) {
            case "similar":
                return (columnRange: number, values: ReadonlyArray<number>) => {
                    // Can't do standard deviation of array of 1
                    if (values.length <= 1) {
                        return 0;   // Consider constraint met
                    }

                    return 2 * Util.stdDev(values) / columnRange;
                }

            case "different":
                return (columnRange: number, values: ReadonlyArray<number>) => {
                    // Can't do standard deviation of array of 1
                    if (values.length <= 1) {
                        return 1;   // Consider constraint not met
                    }

                    return (columnRange - 2 * Util.stdDev(values)) / columnRange;
                }
        }

        throw new Error("Unknown similarity constraint condition function");
    }
}
