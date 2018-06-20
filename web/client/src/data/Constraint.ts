import * as UUID from "../util/UUID";

import { Data as IColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor, ColumnData } from "./ColumnData";
import * as Record from "../../../common/Record";

import { parse } from "../util/Number";

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

    export function GetValidFilterFunctionList(constraint: Data) {
        switch (constraint.filter.column.type) {
            case "number":
                return ConstraintPhraseMaps.NumberFilterFunctionList;
            case "string":
                return ConstraintPhraseMaps.StringFilterFunctionList;
        }

        throw new Error("Unknown column type");
    }

    export function GetValidGroupSizeApplicabilityConditionList(groupSizes: ReadonlyArray<number>) {
        const list: { value: number | undefined, text: string }[] =
            groupSizes.map((size) => ({
                value: size,
                text: "" + size,
            }));

        list.unshift({
            value: undefined,
            text: "any number of",
        });

        return list;
    }

    export function GetGroupSizeApplicabilityCondition(constraint: Data) {
        return constraint.applicability.find(condition => condition.type === "group-size");
    }

    export function GetFilterColumn(constraint: Data, columns: ReadonlyArray<IColumnData>) {
        return columns.find(c => ColumnData.Equals(c, constraint.filter.column));
    }

    export function IsFilterColumnValid(constraint: Data, columns: ReadonlyArray<IColumnData_MinimalDescriptor>) {
        return columns.some(c => ColumnData.Equals(c, constraint.filter.column));
    }

    export function IsFilterValueValid(constraint: Data, columns: ReadonlyArray<IColumnData>) {
        switch (constraint.type) {
            case "count":
            case "limit": {
                const filterValue = constraint.filter.values[0] as string;

                switch (constraint.filter.column.type) {
                    case "number": {
                        // Needs to be parsable as number

                        // Any parseable numeric string is acceptable, except for empty
                        // string
                        if (typeof filterValue === "string" && filterValue.trim().length === 0) {
                            return false;
                        } else {
                            const validDecimalNumericStringRegex = /^-?\d+\.?\d*$/;

                            const parsedNewValue = parse(filterValue, Number.NaN);

                            // * Check that the number is valid
                            //
                            // * Check that the numeric value is properly representable 
                            //   as a plain fixed decimal number by checking that its
                            //   string representation is valid as a decimal number
                            // 
                            //   This can happen in the case of long numbers
                            //   (e-notation) or large numbers that JS can't handle 
                            //   ("Infinity")
                            if (Number.isNaN(parsedNewValue) ||
                                !("" + parsedNewValue).match(validDecimalNumericStringRegex)) {
                                return false;
                            } else {
                                return true;
                            }
                        }
                    }

                    case "string": {
                        return (
                            // Must be a number which is also part of the
                            // column's value set
                            typeof filterValue === "string"
                            && IsFilterColumnValid(constraint, columns)
                            && (ColumnData.GetValueSet(GetFilterColumn(constraint, columns)!) as Set<string>).has(filterValue)
                        );
                    }
                }

                throw new Error("Unknown column type");
            }

            // Similarity constraints don't have filter values
            case "similarity": return true;
        }

        throw new Error("Unknown constraint type");
    }

    export function IsFilterFunctionValid(constraint: Data) {
        switch (constraint.type) {
            case "count":
            case "limit": {
                const validFilterFunctions = GetValidFilterFunctionList(constraint);
                const filterFunction = constraint.filter.function;

                return validFilterFunctions.some(f => f.value === filterFunction);
            }

            // Similarity constraints don't have filter functions
            case "similarity": return true;
        }

        throw new Error("Unknown constraint type");
    }

    export function IsGroupSizeApplicabilityConditionValid(constraint: Data, groupSizes: ReadonlyArray<number>) {
        const validList = GetValidGroupSizeApplicabilityConditionList(groupSizes);
        const applicabilityCondition = GetGroupSizeApplicabilityCondition(constraint);

        if (applicabilityCondition === undefined) {
            return true;
        }

        return validList.some(x => x.value === applicabilityCondition.value);
    }

    export function IsValid(constraint: Data, columns: ReadonlyArray<IColumnData>, groupSizes: ReadonlyArray<number>) {
        return (
            IsFilterColumnValid(constraint, columns)
            && IsFilterValueValid(constraint, columns)
            && IsFilterFunctionValid(constraint)
            && IsGroupSizeApplicabilityConditionValid(constraint, groupSizes)
        );
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
