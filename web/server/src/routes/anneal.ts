import * as express from "express";

// Signature of exported function must not be altered for all routers
module.exports = () => {
    const router = express.Router();

    router.route("/")
        .post(PostDataAnnealHandler);

    return router;
};

const PostDataAnnealHandler: express.RequestHandler =
    (req, res, _next) => {
        const data: IncomingData = req.body;

        return res
            .status(200)
            .json({
                numberOfRecords: data.sourceData.records.length,
            });
    };


/// Types

/** Element value in a record */
type SourceDataRecordElement = number | string;
/** A record is an array of values (elements) */
type SourceDataRecord = ReadonlyArray<SourceDataRecordElement>;

type SourceDataRecordArray = ReadonlyArray<SourceDataRecord>;

interface SourceDataNonPartitioned {
    /** Flat array of records */
    readonly records: SourceDataRecordArray,
    /** Indicates records are *not* split for parallel processing */
    readonly isPartitioned: false,
}

interface SourceDataPartitioned {
    /** 
     * Array of an array of records
     * 
     * This is as a result of being "partitioned", which is when the record set
     * is already split in such a way that it can be processed in parallel
     */
    readonly records: ReadonlyArray<SourceDataRecordArray>,
    /** Indicates records are already split for parallel processing */
    readonly isPartitioned: true,
}

interface SourceDataDescBase {
    /** Describes all columns */
    readonly columns: ReadonlyArray<SourceDataColumnDesc>,
}

type SourceDataDesc = SourceDataDescBase & (
    SourceDataNonPartitioned |
    SourceDataPartitioned
);

interface SourceDataColumnDesc {
    /** Column heading text */
    readonly label: string,
    /** 0 = number, 1 = string */
    readonly type: number,
    /**
     * Identifies if column contains unique identifiers;
     * only one "true" value permissible in a source data set
     */
    readonly isId: boolean,
}

interface StrataDesc {
    /** Label */
    readonly label: string,
    /** Size allocation */
    readonly size: {
        /** Absolute minimum strata group size */
        readonly min: number,
        /** Desired strata group size */
        readonly ideal: number,
        /** Absolute maximum strata group size */
        readonly max: number,
    }
}

type ConstraintDesc =
    ConstraintBase & (
        ConstraintLimit |
        ConstraintCountable |
        ConstraintSimilarity
    );

type ConstraintComparisonFunction = "eq" | "neq" | "lt" | "lte" | "gt" | "gte";
type ConstraintLimitFunction = "low" | "high";
type ConstraintSimilarityFunction = "similar" | "different";

type ConstraintApplicabilityCondition =
    ConstraintApplicabilityGroupSizeCondition;

interface ConstraintApplicabilityGroupSizeCondition {
    readonly type: "group-size",

    /**
     * Comparison function
     * 
     * e.g. the group size is *equal to* [value]
     */
    readonly function: ConstraintComparisonFunction,
    /**
     * Group size target
     * 
     * e.g. the group size is equal to *[value]*
     */
    readonly value: number,
}

interface ConstraintBase {
    /** The i-th strata that this constraint applies to */
    readonly strata: number,
    /** Weight applied to this constraint in the annealing algorithm */
    readonly weight: number,
    /**
     * Constraint applicability conditions
     * 
     * This constraint will only be considered if the applicability filters are
     * all met, or if there are no conditions imposed
     */
    readonly applicabilityConditions: ReadonlyArray<ConstraintApplicabilityCondition>,
}

interface ConstraintLimit extends ConstraintBase {
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
        readonly function: ConstraintComparisonFunction,
        /**
         * Filter search values
         * 
         * Multiple search values are only supported when function = "eq" or
         * "neq", othrewise first value used
         * 
         * e.g. the record element value needs to be greater than *[value]* to
         *      be counted
         */
        readonly searchValues: ReadonlyArray<SourceDataRecordElement>,
    },

    /** Limit description */
    readonly condition: {
        /**
         * Limit tends to...
         * 
         * e.g. we need the number of filtered records to be as *low* as possible
         */
        readonly function: ConstraintLimitFunction,
    },
}

interface ConstraintCountable extends ConstraintBase {
    readonly type: "countable",

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
        readonly function: ConstraintComparisonFunction,
        /**
         * Filter search values
         * 
         * Multiple search values are only supported when function = "eq" or
         * "neq", otherwise first value used
         * 
         * e.g. the record element value needs to be greater than *[value]* to
         *      be counted
         */
        readonly searchValues: ReadonlyArray<SourceDataRecordElement>,
    },

    /** Count condition description */
    readonly condition: {
        /**
         * Count condition function
         * 
         * e.g. we need *at least* [value] instances in this group
         */
        readonly function: ConstraintComparisonFunction,
        /**
         * Count condition target
         * 
         * e.g. we need at least *[value]* instances in this group
         */
        readonly value: number,
    },
}

interface ConstraintSimilarity extends ConstraintBase {
    readonly type: "similarity",

    /** Similarity description */
    readonly condition: {
        /**
         * Similarity function
         * 
         * e.g. we need record elements to be *similar* in this group
         */
        readonly function: ConstraintSimilarityFunction,
    },
}

interface ConfigDesc {
    /**
     * Number of iterations to run
     */
    readonly iterations: number,
    /**
     * Whether the server should return all data and groups annealed rather than
     * just the groups and identifiers
     */
    readonly returnAllData: boolean,
}

interface IncomingData {
    /** Describes the raw data being fed in from CSV or other data source */
    readonly sourceData: SourceDataDesc,
    /**
     * Describes what and how (nested) subgroups are to be formed
     * 
     * Earlier strata are encompassed by later strata:
     * ```
     *  [
     *      Group,
     *      Table
     *  ]
     * ```
     * means that there are `Group`s within a `Table`.
     * 
     * This used to be called "levels" but renamed to make it less confusing
     */
    readonly strata: ReadonlyArray<StrataDesc>,
    /**
     * Describes constraints
     */
    readonly constraints: ReadonlyArray<ConstraintDesc>,
    /**
     * Describes anneal configuration
     */
    readonly config: ConfigDesc,
}
