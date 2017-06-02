import * as AnnealNode from "../data/AnnealNode";

import { AbstractConstraint } from "./AbstractConstraint";
import { CountConstraint } from "./CountConstraint";
import { LimitConstraint } from "./LimitConstraint";
import { SimilarityNumericConstraint } from "./SimilarityNumericConstraint";
import { SimilarityStringConstraint } from "./SimilarityStringConstraint";

import * as Util from "../core/Util";


/**
 * @param constraint 
 * @param node The stratum node being checked (not root node)
 * @param allLeaves All leaves regardless of whether they're under the node
 */
export function calculateSatisfaction(constraint: AbstractConstraint, node: AnnealNode.AnnealNode) {
    // Get all record pointers under node
    const recordPointers = AnnealNode.getRecordPointers(node);

    // If not applicable, return undefined
    constraint.isApplicableTo(recordPointers);

    switch (constraint.constraintDef.type) {
        case "count": return Count.calculateSatisfaction(constraint as CountConstraint, recordPointers);
        case "limit": return Limit.calculateSatisfaction(constraint as LimitConstraint, recordPointers);
        case "similarity": return Similarity.calculateSatisfaction(constraint as SimilarityNumericConstraint | SimilarityStringConstraint, recordPointers);
    }

    throw new Error("Unrecognised constraint type");
}


export namespace Count {
    export function calculateSatisfaction(constraint: CountConstraint, recordPointers: Set<number>) {
        // Calculate cost
        const cost = constraint.calculateUnweightedCost(recordPointers);

        // Satisfaction is exact - if the constraint is met, cost is 0, and we
        // return 1 for the satisfaction value
        if (cost === 0) {
            return 1;   // 100% satisfied
        } else {
            return 0;   // 0% satisfied
        }
    }
}

export namespace Limit {
    export function calculateSatisfaction(constraint: LimitConstraint, recordPointers: Set<number>) {
        const groupSize = recordPointers.size;

        // If there are no elements in group, then we say it has met constraint
        if (groupSize === 0) {
            return 1;   // 100% satisfied
        }

        // Calculate proportion of the group leaves is covered by filtered
        // leaves
        const filterSatisfiedCount = constraint.countFilterSatisfyingRecords(recordPointers);
        const proportion = filterSatisfiedCount / groupSize;

        // Use original constraint to determine what to do
        switch (constraint.constraintDef.condition.function) {
            case "low": {
                // Satisfaction is negatively proportional (lower proportion =
                // higher satisfaction)
                return 1 - proportion;
            }

            case "high": {
                // Satisfaction is proportional
                return proportion;
            }
        }

        throw new Error("Unrecognised constraint condition function");
    }
}

export namespace Similarity {
    function calculateNumericSatisfaction(constraint: SimilarityNumericConstraint, recordPointers: Set<number>) {
        const columnInfo = constraint.columnInfo;
        const values = constraint.getValues(recordPointers);

        if (columnInfo.type !== "number") {
            throw new Error("Expected numeric column type");
        }

        // 100% satisfaction if there are no values or if there is only one
        // value (in which case we can't tell how "similar" they are)
        if (values.length <= 1) {
            return 1;
        }

        const columnRange = columnInfo.range;
        const stdDev = Util.stdDev(values);

        switch (constraint.constraintDef.condition.function) {
            case "similar": {
                // Satisfaction is based on whether the standard
                // deviation is under 10% of the general column range.
                // Returned satisfaction is binary - if it falls outside
                // the 10% range, it is considered "not met".
                if (stdDev / columnRange < 0.1) {
                    return 1;   // 100% satisfaction
                } else {
                    return 0;   // 0% satisfaction
                }
            }

            case "different": {
                // Satisfaction is based on whether the standard
                // deviation is over 25% of the general column range.
                // Returned satisfaction is binary - if it falls outside
                // the 25% range, it is considered "not met".
                if (stdDev / columnRange > 0.25) {
                    return 1;   // 100% satisfaction
                } else {
                    return 0;   // 0% satisfaction
                }
            }
        }

        throw new Error("Unknown condition function");
    }

    function calculateStringSatisfaction(constraint: SimilarityStringConstraint, recordPointers: Set<number>) {
        switch (constraint.constraintDef.condition.function) {
            case "similar":
            case "different": {
                // Calculate cost
                const cost = constraint.calculateUnweightedCost(recordPointers);

                // Satisfaction is exact - it either meets the condition
                // or not (either fully same or fully different)
                if (cost === 0) {
                    return 1;   // 100% satisfied
                } else {
                    return 0;   // 0% satisfied
                }
            }
        }

        throw new Error("Unknown condition function");
    }

    export function calculateSatisfaction(constraint: SimilarityNumericConstraint | SimilarityStringConstraint, recordPointers: Set<number>) {
        switch (constraint.columnInfo.type) {
            case "number": return calculateNumericSatisfaction(constraint as SimilarityNumericConstraint, recordPointers);
            case "string": return calculateStringSatisfaction(constraint as SimilarityStringConstraint, recordPointers);
        }

        throw new Error("Unknown column type");
    }
}
