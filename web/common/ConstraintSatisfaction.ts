export interface SatisfactionMap {
    [nodeId: string]: NodeSatisfactionObject,
}

export interface NodeSatisfactionObject {
    [constraintId: string]: number | undefined,
}
