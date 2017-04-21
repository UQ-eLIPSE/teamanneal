import * as Constraint from "./Constraint";
import * as SourceData from "./SourceData";
import * as Strata from "./Strata";

export interface ConfigDesc {
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

export interface Root {
    /** Describes the raw data being fed in from CSV or other data source */
    readonly sourceData: SourceData.Desc,
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
    readonly strata: ReadonlyArray<Strata.Desc>,
    /**
     * Describes constraints
     */
    readonly constraints: ReadonlyArray<Constraint.Desc>,
    /**
     * Describes anneal configuration
     */
    readonly config: ConfigDesc,
}
