import { Data as Constraint } from "./Constraint";

export interface ConstraintConfig {
    constraints: Constraint[],
}

export function initNew() {
    return {
        constraints: [],
    } as ConstraintConfig;
}
