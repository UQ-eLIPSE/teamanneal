import { Data as Constraint } from "./Constraint";

export interface ConstraintConfig {
    constraints: Constraint[],
}

export function init(constraints: Constraint[] = []) {
    const obj: ConstraintConfig = {
        constraints,
    };

    return obj;
}
