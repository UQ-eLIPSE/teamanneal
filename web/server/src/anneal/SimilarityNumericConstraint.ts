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

        // Store values
        this.recordValueArray = recordValueArray;
    }

    public calculateUnweightedCost(recordPointers: Set<number>) {
        const columnInfo = this.columnInfo;

        if (columnInfo.type !== "number") {
            throw new Error("Expected numeric column type");
        }

        // If the column of values has no range (all same) = free of cost
        const columnRange = columnInfo.range;

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
        return SimilarityNumericConstraint.computeConditionCost(this.constraintDef.condition.function, columnRange, values);
    }

    public getValues(recordPointers: Set<number>) {
        // Get record values (numbers); drop any NaN values as they represent
        // empty elements
        const values: number[] = [];

        recordPointers.forEach((recordPointer) => {
            const value = this.recordValueArray[recordPointer];

            // Ignore NaNs
            if (Number.isNaN(value)) { return; }

            values.push(value);
        });

        return values as ReadonlyArray<number>;
    }

    private static computeConditionCost(fn: string, columnRange: number, values: ReadonlyArray<number>) {
        switch (fn) {
            case "similar": return 2 * Util.stdDev(values) / columnRange;
            case "different": return (columnRange - 2 * Util.stdDev(values)) / columnRange;
        }

        throw new Error("Unknown similarity constraint condition function");
    }
}
