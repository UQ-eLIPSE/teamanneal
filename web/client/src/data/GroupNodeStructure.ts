import { GroupNodeRoot } from "./GroupNodeRoot";

export interface GroupNodeStructure {
    roots: GroupNodeRoot[],
}

export function initNew(roots: GroupNodeRoot[] = []) {
    const obj: GroupNodeStructure = {
        roots,
    };

    return obj;
}
