import { GroupNodeRoot } from "./GroupNodeRoot";

export interface GroupNodeStructure {
    roots: GroupNodeRoot[],
}

export function init(roots: GroupNodeRoot[] = []) {
    const obj: GroupNodeStructure = {
        roots,
    };

    return obj;
}
