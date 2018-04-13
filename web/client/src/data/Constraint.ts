import * as UUID from "../util/UUID";

import { MinimalDescriptor as IColumnData_MinimalDescriptor } from "./ColumnData";
import * as Record from "../../../common/Record";

export type Data = Limit | Count | Similarity;

type Type = "limit" | "count" | "similarity";
type Filter = LimitFilter | CountFilter | SimilarityFilter;
type Condition = LimitCondition | CountCondition | SimilarityCondition;

type ComparisonFunction = "eq" | "neq" | "lt" | "lte" | "gt" | "gte";
type LimitFunction = "low" | "high";
type SimilarityFunction = "similar" | "different";

type ApplicabilityCondition =
    ApplicabilityGroupSizeCondition;

export interface ApplicabilityGroupSizeCondition {
    type: "group-size",
    function: ComparisonFunction,
    value: number,
}

interface ConstraintBase {
    _id: string,
    type: Type,
    /** Stratum object ID */
    stratum: string,
    weight: number,
    applicability: ApplicabilityCondition[],
}

interface FilterBase {
    /**
     * Minimal form of column data object associated with this filter
     * 
     * Using minimal descriptor instead of object ID to be able to fall back
     * onto column label
     */
    column: IColumnData_MinimalDescriptor,
}

export interface Limit extends ConstraintBase {
    type: "limit",
    filter: LimitFilter,
    condition: LimitCondition,
}

export interface LimitFilter extends FilterBase {
    function: ComparisonFunction,
    values: Record.RecordElement[],
}

export interface LimitCondition {
    function: LimitFunction,
}

export interface Count extends ConstraintBase {
    type: "count",
    filter: CountFilter,
    condition: CountCondition,
}

export interface CountFilter extends FilterBase {
    function: ComparisonFunction,
    values: Record.RecordElement[],
}

export interface CountCondition {
    function: ComparisonFunction,
    value: number,
}

export interface Similarity extends ConstraintBase {
    type: "similarity",
    filter: SimilarityFilter,
    condition: SimilarityCondition,
}

export interface SimilarityFilter extends FilterBase { }

export interface SimilarityCondition {
    function: SimilarityFunction,
}



export namespace Constraint {
    export function Init(
        type: "limit",
        weight: number,
        stratum: string,
        filter: LimitFilter,
        condition: LimitCondition,
        applicability?: ApplicabilityCondition[],
    ): Limit
    export function Init(
        type: "count",
        weight: number,
        stratum: string,
        filter: CountFilter,
        condition: CountCondition,
        applicability?: ApplicabilityCondition[],
    ): Count
    export function Init(
        type: "similarity",
        weight: number,
        stratum: string,
        filter: SimilarityFilter,
        condition: SimilarityCondition,
        applicability?: ApplicabilityCondition[],
    ): Similarity
    export function Init(
        type: Type,
        weight: number,
        stratum: string,
        filter: Filter,
        condition: Condition,
        applicability: ApplicabilityCondition[] = [],
    ): Data {
        const _id = UUID.generate();

        switch (type) {
            case "limit": {
                const data: Limit = {
                    _id,
                    type,
                    stratum,
                    weight,
                    filter: filter as LimitFilter,
                    condition: condition as LimitCondition,
                    applicability,
                };

                return data;
            }

            case "count": {
                const data: Count = {
                    _id,
                    type,
                    stratum,
                    weight,
                    filter: filter as CountFilter,
                    condition: condition as CountCondition,
                    applicability,
                };

                return data;
            }

            case "similarity": {
                const data: Similarity = {
                    _id,
                    type,
                    stratum,
                    weight,
                    filter: filter as SimilarityFilter,
                    condition: condition as SimilarityCondition,
                    applicability,
                };

                return data;
            }
        }

        throw new Error("Unknown constraint type");
    }

    export function Equals(a: Data, b: Data) {
        return a._id === b._id;
    }
}

export namespace ConstraintPhraseMaps {
    export const NumberFilterFunctionList = [
        {
            value: "eq",
            text: "equal to",
        },
        {
            value: "neq",
            text: "not equal to",
        },
        {
            value: "lt",
            text: "less than",
        },
        {
            value: "lte",
            text: "less than or equal to",
        },
        {
            value: "gt",
            text: "greater than",
        },
        {
            value: "gte",
            text: "greater than or equal to",
        },
    ];

    export const StringFilterFunctionList = [
        {
            value: "eq",
            text: "equal to",
        },
        {
            value: "neq",
            text: "not equal to",
        },
    ];

    export const ConditionFunctionList = [
        {
            value: "eq",
            text: "exactly",
        },
        {
            value: "neq",
            text: "not exactly",
        },
        {
            value: "gte",
            text: "at least",
        },
        {
            value: "lte",
            text: "at most",
        },
        {
            value: "gt",
            text: "more than",
        },
        {
            value: "lt",
            text: "fewer than",
        },
        {
            value: "low",
            text: "as few",
        },
        {
            value: "high",
            text: "as many",
        },
        {
            value: "similar",
            text: "similar values of",
        },
        {
            value: "different",
            text: "different values of",
        },
    ];

    export const CostWeightList = [
        {
            value: 2,
            text: "may have",
        },
        {
            value: 10,
            text: "could have",
        },
        {
            value: 50,
            text: "should have",
        },
        {
            value: 1000,
            text: "must have",
        },
    ];
}

export namespace ConstraintSentence {

    /** Constructs a phrase from the key-values in the `constraint` prop. */
    export function convertConstraintToSentence(constraint: Data, selectedStratumLabel: string) {
        let sentence = "";

        sentence += selectedStratumLabel + ' ';
        sentence += getWeightText(constraint);
        sentence += getConstraintConditionFunctionText(constraint);
        sentence += getPersonUnitText(constraint);
        sentence += getConstraintFilterText(constraint);
        sentence += ' when ' + selectedStratumLabel + ' has ';
        sentence += getConstraintGroupApplicabilityText(constraint);

        return sentence;
    }

    function getWeightText(constraint: Data) {
        return findItemInList(ConstraintPhraseMaps.CostWeightList, "value", constraint.weight).text + ' ';
    }

    function getConstraintConditionFunctionText(constraint: Data) {
        let phrase = findItemInList(ConstraintPhraseMaps.ConditionFunctionList, "value", constraint.condition.function).text + ' ';
        if (showConditionCount(constraint)) {
            phrase += (constraint.condition as any).value + ' ';
        }

        return phrase;
    }

    function getPersonUnitText(constraint: Data) {
        if (personUnitNounFollowsCondition(constraint)) {
            return personUnitNoun(constraint) + ' with ';
        }
        return '';
    }

    function getConstraintFilterText(constraint: Data) {
        let phrase = constraint.filter.column.label + ' ';

        if (showFilterFunction(constraint)) {
            phrase += constraintFilterFunction(constraint) + ' ' + (constraint.filter as any).values[0];
        }

        return phrase;
    }

    function getConstraintGroupApplicabilityText(constraint: Data) {
        return constraintApplicabilityPhrase(constraint) + ' ' + groupSizeApplicabilityConditionPersonUnitNoun(constraint);
    }

    // -------------------------------------------------
    // Utility functions for building constraint phrases
    // -------------------------------------------------

    /**
     * Determines if the person unit noun ("person" or "people") comes after
     * the condition function text in the constraint sentence
     */
    function personUnitNounFollowsCondition(constraint: Data) {
        switch (constraint.condition.function) {
            case "similar":
            case "different":
                return false;
        }

        return true;
    }

    function constraintApplicability(constraint: Data) {
        const groupSizeApplicability = constraint.applicability.find((applicabilityObject) => applicabilityObject.type === 'group-size');
        if (groupSizeApplicability !== undefined) {
            return groupSizeApplicability.value;
        }

        return undefined;
    }

    function constraintApplicabilityPhrase(constraint: Data) {
        return constraintApplicability(constraint) || " any number of ";
    }

    function showFilterFunction(constraint: Data) {
        switch (constraint.condition.function) {
            case "similar":
            case "different":
                return false;
        }

        return true;
    }

    function constraintFilterFunction(constraint: Data) {
        const filterType = constraint.filter.column.type;
        const list = filterType === "number" ? ConstraintPhraseMaps.NumberFilterFunctionList : ConstraintPhraseMaps.StringFilterFunctionList;
        return findItemInList(list, "value", (constraint.filter as any).function).text;
    }

    /**
     * Generates the appropriate (pluralised) noun for the constraint sentence
     */
    function personUnitNoun(constraint: Data) {
        // If the count is exactly one, return "person"
        if (showConditionCount(constraint) && (constraint.condition as any).value === 1) {
            return "person";
        } else {
            return "people";
        }
    }

    function showConditionCount(constraint: Data) {
        switch (constraint.condition.function) {
            case "low":
            case "high":
            case "similar":
            case "different":
                return false;
        }

        return true;
    }

    function groupSizeApplicabilityConditionPersonUnitNoun(constraint: Data) {
        if (constraintApplicability(constraint) === undefined) {
            return "people";
        }

        if (constraintApplicability(constraint) === 1) {
            return "person";
        }

        return "people";
    }

    /**
     * A generic function used for finding array items for `value-text` maps in `ConstraintPhraseMaps` (see import)
     */
    function findItemInList(list: any[], property: string, value: any) {
        return list.find((listItem: any) => listItem[property] === value);
    }
}

