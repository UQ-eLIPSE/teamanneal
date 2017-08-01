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

interface ApplicabilityGroupSizeCondition {
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
