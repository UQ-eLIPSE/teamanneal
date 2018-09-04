export interface SatisfactionMap {
    [nodeId: string]: NodeSatisfactionObject,
}

export interface NodeSatisfactionObject {
    [constraintId: string]: number | undefined | MultipleSatisfactionObject,
}


export type MultipleSatisfactionObject = {
    nodeToSatisfactionMapForConstraint: { [key: string]: number | undefined },
    stats: MultipleSatisfactionStats
}

export type MultipleSatisfactionStats = {
    expectedDistribution: { [satisfyingCountInNode: number]: number },
    actualDistribution: { [satisfyingCountInNode: number]: number }
}