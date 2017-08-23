import * as AnnealNode from "./AnnealNode";
import * as Constraint from "./Constraint";
import * as RecordData from "./RecordData";
import * as Stratum from "./Stratum";

export interface Root {
    /** Describes the raw data being fed in from CSV or other data source */
    readonly recordData: RecordData.Desc,

    /** An array of parallelisable anneal requests */
    readonly annealNodes: ReadonlyArray<AnnealNode.NodeRoot>,

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
    readonly strata: ReadonlyArray<Stratum.Desc>,

    /** Describes constraints */
    readonly constraints: ReadonlyArray<Constraint.Desc>,
}
