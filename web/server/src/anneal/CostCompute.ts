import { AbstractConstraint } from "./AbstractConstraint";

import * as AnnealNode from "../data/AnnealNode";
// import * as ColumnInfo from "../data/ColumnInfo";
import * as CostCache from "../data/CostCache";

export function computeCost(constraints: ReadonlyArray<AbstractConstraint>, node: AnnealNode.AnnealNode) {
    const baseCost = sumChildrenCost(node);
    const recordPointers = AnnealNode.getRecordPointers(node);

    // Apply constraints and calculate cost
    let constraintsCost = 0;

    constraints.forEach((constraint) => {
        const cost = constraint.calculateWeightedCost(recordPointers);

        // Add cost in to total constraint cost
        constraintsCost += cost;
    });

    return baseCost + constraintsCost;
}

export function computeAndCacheCost(constraints: ReadonlyArray<AbstractConstraint>, node: AnnealNode.AnnealNode) {
    const cost = computeCost(constraints, node);

    CostCache.insert(node, cost);

    return cost;
}

export function sumChildrenCost(node: AnnealNode.AnnealNode) {
    let cost = 0;

    AnnealNode.forEachChild(node, (child) => {
        const costValue = CostCache.get(child);

        // Error if cost cache object not found
        if (costValue === undefined) {
            throw new Error("Expected cost cache object for node; object not found");
        }

        cost += costValue;
    });

    return cost;
}

export function computeAndCacheStratumCost(constraints: ReadonlyArray<AbstractConstraint>, nodes: ReadonlyArray<AnnealNode.AnnealNode>) {
    return nodes.map(node => computeAndCacheCost(constraints, node));
}
