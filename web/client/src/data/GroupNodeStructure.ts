import { GroupNodeRoot } from "./GroupNodeRoot";

export interface GroupNodeStructure {
    roots: GroupNodeRoot[],
}

export function initNew() {
    const obj: GroupNodeStructure = {
        roots: [],
    };

    return obj;
}
