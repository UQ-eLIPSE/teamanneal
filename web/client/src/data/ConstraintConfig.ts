import { Data as Constraint } from "./Constraint";

export interface ConstraintConfig {
    constraints: Constraint[],
}

export function initNew(constraints: Constraint[] = []) {
    const obj: ConstraintConfig = {
        constraints,
    };

    return obj;
}
