import { AbstractConstraint } from "./AbstractConstraint";

import * as Record from "../../../common/Record";

import { StringPointer, StringMap } from "../data/StringMap";

export class SimilarityStringConstraint extends AbstractConstraint {
    /** 
     * An array of StringMap pointer values for each record element's actual 
     * string value (which is stored in the string map)
     * 
     * A string can be compared for equality very quickly by then comparing 
     * their pointer values.
     * 
     * See "string interning" for more on this practice: https://en.wikipedia.org/wiki/String_interning
     */
    private recordStringPointerArray: Uint32Array;
    private stringMap: StringMap;

    private constraintConditionCostFunction: (groupSize: number, distinctSetSize: number) => number;

    protected init(records: Record.RecordSet) {
        // Initialise record array
        const recordStringPointerArray = new Uint32Array(records.length);

        // Get information about this constraint
        const constraintDef = this.constraintDef;
        const columnInfo = this.columnInfo;

        if (constraintDef.type !== "similarity") {
            throw new Error("Expected similarity constraint definition");
        }

        if (columnInfo.type !== "string") {
            throw new Error("Expected string column type");
        }

        const colIndex = constraintDef.filter.column;

        const stringMap = new StringMap();

        // Copy out all column string values
        for (let recordIndex = 0; recordIndex < records.length; ++recordIndex) {
            const record = records[recordIndex];
            const recordElement = record[colIndex];

            // Forbid numbers, nulls
            if (typeof recordElement === "number" || recordElement === null) {
                throw new Error("Number or null record element not acceptable for string constraint");
            }

            // Add string to string map, and save the resulting pointer into the
            // string pointer array
            recordStringPointerArray[recordIndex] = stringMap.add(recordElement);
        }

        // Store to this object
        this.recordStringPointerArray = recordStringPointerArray;
        this.stringMap = stringMap;
        this.constraintConditionCostFunction = SimilarityStringConstraint.generateConditionCostFunction(constraintDef.condition.function);
    }

    public calculateUnweightedCost(recordPointers: Uint32Array) {
        const groupSize = recordPointers.length;
        const recordStringPointerArray = this.recordStringPointerArray;

        // Collect up distinct strings (via. string pointers)
        // If pointers are distinct, the strings are distinct
        const set: Set<StringPointer> = new Set();

        for (let i = 0; i < groupSize; ++i) {
            const recordPointer = recordPointers[i];
            set.add(recordStringPointerArray[recordPointer]);
        }

        const distinctSetSize = set.size;

        // Run condition cost function 
        return this.constraintConditionCostFunction(groupSize, distinctSetSize);
    }

    private static generateConditionCostFunction(fn: string) {
        switch (fn) {
            case "similar": return (_groupSize: number, distinctSetSize: number) => {
                // If no values, then free of cost
                if (distinctSetSize === 0) {
                    return 0;
                }

                return distinctSetSize - 1;
            }
            case "different": return (groupSize: number, distinctSetSize: number) => groupSize - distinctSetSize;
        }

        throw new Error("Unknown similarity constraint condition function");
    }
}
