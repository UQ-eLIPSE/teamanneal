import * as ConstraintSatisfaction from "../../../common/ConstraintSatisfaction";
import { NodeSatisfactionObject, SatisfactionMap } from "../../../common/ConstraintSatisfaction";

import { AbstractConstraint } from "../data/AbstractConstraint";
import { CountConstraint } from "../data/CountConstraint";
import { LimitConstraint } from "../data/LimitConstraint";
import { SimilarityNumericConstraint } from "../data/SimilarityNumericConstraint";
import { SimilarityStringConstraint } from "../data/SimilarityStringConstraint";

import { AnnealStratum } from "../data/AnnealStratum";
import { AnnealStratumNode } from "../data/AnnealStratumNode";

import * as Util from "../core/Util";

/**
 * @param constraint 
 * @param node The stratum node being checked (not root node)
 * @param allLeaves All leaves regardless of whether they're under the node
 */
export function calculateValue(constraint: AbstractConstraint, node: AnnealStratumNode) {
    const recordPointers = node.getRecordPointers();

    // If not applicable, return undefined
    if (!constraint.isApplicableTo(recordPointers)) {
        return undefined;
    }

    switch (constraint.constraintDef.type) {
        case "count": return Count.calculateSatisfaction(constraint as CountConstraint, recordPointers);
        case "limit": return Limit.calculateSatisfaction(constraint as LimitConstraint, recordPointers);
        case "similarity": return Similarity.calculateSatisfaction(constraint as SimilarityNumericConstraint | SimilarityStringConstraint, recordPointers);
    }

    throw new Error("Unrecognised constraint type");
}

export function calculateSatisfactionObject(constraint: AbstractConstraint, node: AnnealStratumNode) {
    const satisfactionObject: ConstraintSatisfaction.NodeSatisfactionObject = {
        [constraint.constraintDef._id]: calculateValue(constraint, node),
    };

    return satisfactionObject;
}

/**
 * Generates a satisfaction map object for one stratum.
 */
export function generateSingleStratumMap(constraints: ReadonlyArray<AbstractConstraint>, stratum: AnnealStratum) {
    // We only work with constraints that actually apply to this stratum
    const applicableConstraints = constraints.filter(c => c.constraintDef.stratum === stratum.id);

    // Collect up all node satisfaction objects into one large lookup map
    return stratum.nodes.reduce<SatisfactionMap>((satisfactionMap, node) => {
        const nodeId = node.getId();

        // Collect up all constraint satisfaction for this node in an object
        satisfactionMap[nodeId] = applicableConstraints.reduce<NodeSatisfactionObject>((nodeSatisfactionObject, constraint) => {
            return Object.assign(nodeSatisfactionObject, calculateSatisfactionObject(constraint, node));
        }, {});

        return satisfactionMap;
    }, {});
}

/**
 * Generates a satisfaction map object that covers all given strata.
 */
export function generateMap(constraints: ReadonlyArray<AbstractConstraint>, strata: ReadonlyArray<AnnealStratum>) {
    // Generate satisfaction map of all stratum nodes combined into one
    return strata
        .map(stratum => generateSingleStratumMap(constraints, stratum))
        .reduce((carry, stratumSatisfactionMap) => Object.assign(carry, stratumSatisfactionMap), {});
}


export namespace Count {
    export function calculateSatisfaction(constraint: CountConstraint, recordPointers: Uint32Array) {
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
    export function calculateSatisfaction(constraint: LimitConstraint, recordPointers: Uint32Array) {
        const groupSize = recordPointers.length;

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
    function calculateNumericSatisfaction(constraint: SimilarityNumericConstraint, recordPointers: Uint32Array) {
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

    function calculateStringSatisfaction(constraint: SimilarityStringConstraint, recordPointers: Uint32Array) {
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

    export function calculateSatisfaction(constraint: SimilarityNumericConstraint | SimilarityStringConstraint, recordPointers: Uint32Array) {
        switch (constraint.columnInfo.type) {
            case "number": return calculateNumericSatisfaction(constraint as SimilarityNumericConstraint, recordPointers);
            case "string": return calculateStringSatisfaction(constraint as SimilarityStringConstraint, recordPointers);
        }

        throw new Error("Unknown column type");
    }
}
