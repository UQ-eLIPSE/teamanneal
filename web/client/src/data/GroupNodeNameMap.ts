export interface GroupNodeNameMap {
    [nodeId: string]: string,
}

export function initNew() {
    const obj: GroupNodeNameMap = {};

    return obj;
}
