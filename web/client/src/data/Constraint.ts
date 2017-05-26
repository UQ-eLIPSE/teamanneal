import * as Constraint from "../../../common/Constraint";

export type Constraint = { _id: number } & Constraint.Desc;

export interface Update {
    constraint: Constraint,
}

