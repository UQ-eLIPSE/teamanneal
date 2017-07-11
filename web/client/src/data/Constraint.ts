import * as Constraint from "../../../common/Constraint";

export type Constraint = {
    _id: string,
    
    /** The stratum is referenced by ID rather than index number in the state */
    _stratumId: string,
} & Constraint.Desc;

export interface Update {
    constraint: Constraint,
}

