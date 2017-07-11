import * as Constraint from "../../../common/Constraint";

export type Constraint = { _id: string } & Constraint.Desc;

export interface Update {
    constraint: Constraint,
}

