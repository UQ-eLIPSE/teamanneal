import { GroupNodeRoot } from "./GroupNodeRoot";

export interface GroupNodeStructure {
    roots: GroupNodeRoot[],
}

export function initNew() {
    return {
        roots: [],
    } as GroupNodeStructure;
}
