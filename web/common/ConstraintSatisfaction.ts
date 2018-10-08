export interface SatisfactionMap {
    [nodeId: string]: NodeSatisfactionObject,
}

export interface NodeSatisfactionObject {
    [constraintId: string]: number | undefined,
}


export type MultipleSatisfactionObject = {
    nodeToSatisfactionMapForConstraint: { [key: string]: number | undefined },
    statistics: MultipleNodeSatisfactionStatistics
}

export type MultipleNodeSatisfactionStatistics = {
    expectedDistribution: { [satisfyingCountInNode: number]: number },
    actualDistribution: { [satisfyingCountInNode: number]: number }
}

export interface SatisfactionState {
    satisfactionMap: SatisfactionMap,
    statistics: { [nodeId: string]: MultipleNodeSatisfactionStatistics }[]
}

export function initConstraintSatisfactionState() {
    const obj: SatisfactionState = { satisfactionMap: {}, statistics: [] };

    return obj;
}