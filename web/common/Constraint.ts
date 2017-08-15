import * as Record from "./Record";

export type Desc =
    Base & (
        Limit |
        Count |
        Similarity
    );

export type FunctionValue =
    ComparisonFunction |
    LimitFunction |
    SimilarityFunction;

export type ComparisonFunction = "eq" | "neq" | "lt" | "lte" | "gt" | "gte";
export type LimitFunction = "low" | "high";
export type SimilarityFunction = "similar" | "different";

export type ApplicabilityCondition =
    ApplicabilityGroupSizeCondition;

export interface ApplicabilityGroupSizeCondition {
    readonly type: "group-size",

    /**
     * Comparison function
     * 
     * e.g. the group size is *equal to* [value]
     */
    readonly function: ComparisonFunction,
    /**
     * Group size target
     * 
     * e.g. the group size is equal to *[value]*
     */
    readonly value: number,
}

export interface Base {
    /** The stratum object ID that this constraint applies to */
    readonly stratum: string,
    /** Weight applied to this constraint in the annealing algorithm */
    readonly weight: number,
    /**
     *  applicability conditions
     * 
     * This constraint will only be considered if the applicability filters are
     * all met, or if there are no conditions imposed
     */
    readonly applicability: ReadonlyArray<ApplicabilityCondition>,
}

export interface Limit extends Base {
    readonly type: "limit",

    /** Record element filter description */
    readonly filter: {
        /** Record column index to run record element filter on */
        readonly column: number,
        /**
         * Filter function
         * 
         * e.g. the record element value needs to be *greater than* [value] to
         *      be counted
         */
        readonly function: ComparisonFunction,
        /**
         * Filter search values
         * 
         * Multiple search values are only supported when function = "eq" or
         * "neq", othrewise first value used
         * 
         * e.g. the record element value needs to be greater than *[value]* to
         *      be counted
         */
        readonly values: ReadonlyArray<Record.RecordElement>,
    },

    /** Limit description */
    readonly condition: {
        /**
         * Limit tends to...
         * 
         * e.g. we need the number of filtered records to be as *low* as possible
         */
        readonly function: LimitFunction,
    },
}

export interface Count extends Base {
    readonly type: "count",

    /** Record element filter description */
    readonly filter: {
        /** Record column index to run record element filter on */
        readonly column: number,
        /**
         * Filter function
         * 
         * e.g. the record element value needs to be *greater than* [value] to
         *      be counted
         */
        readonly function: ComparisonFunction,
        /**
         * Filter search values
         * 
         * Multiple search values are only supported when function = "eq" or
         * "neq", otherwise first value used
         * 
         * e.g. the record element value needs to be greater than *[value]* to
         *      be counted
         */
        readonly values: ReadonlyArray<Record.RecordElement>,
    },

    /** Count condition description */
    readonly condition: {
        /**
         * Count condition function
         * 
         * e.g. we need *at least* [value] instances in this group
         */
        readonly function: ComparisonFunction,
        /**
         * Count condition target
         * 
         * e.g. we need at least *[value]* instances in this group
         */
        readonly value: number,
    },
}

export interface Similarity extends Base {
    readonly type: "similarity",

    /** Record element filter description */
    readonly filter: {
        /** Record column index to check similarity over */
        readonly column: number,
    },

    /** Similarity description */
    readonly condition: {
        /**
         * Similarity function
         * 
         * e.g. we need record elements to be *similar* in this group
         */
        readonly function: SimilarityFunction,
    },
}
