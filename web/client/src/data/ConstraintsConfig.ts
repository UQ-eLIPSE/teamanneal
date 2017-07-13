import * as Stratum from "./Stratum";
import * as Constraint from "./Constraint";

export interface ConstraintsConfig {
    idColumnIndex: number | undefined,
    partitionColumnIndex: number | undefined,

    /**
     * NOTE: This strata order is in tree top-down order because it is used as
     * part of UI (lists, etc.)
     * 
     * This MUST be order reversed prior to delivery to the server as the server
     * uses bottom-up order.
     */
    strata: Stratum.Stratum[],

    constraints: Constraint.Constraint[],
}
