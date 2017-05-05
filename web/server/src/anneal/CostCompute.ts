import * as ProcessedConstraint from "./ProcessedConstraint";

import * as AnnealNode from "../data/AnnealNode";
import * as ColumnInfo from "../data/ColumnInfo";
import * as CostCache from "../data/CostCache";

export function computeCost(leaves: ReadonlyArray<AnnealNode.AnnealNode>, constraints: ReadonlyArray<ProcessedConstraint.ProcessedConstraint>, columnInfos: ReadonlyArray<ColumnInfo.ColumnInfo>, node: AnnealNode.AnnealNode) {
    const baseCost = sumChildrenCost(node);

    // Apply constraints and calculate cost
    let constraintsCost = 0;

    constraints.forEach((constraint) => {
        // Run applicability check (only if there are such conditions)
        const applicabilityFunctions = constraint.applicabilityFunctions;

        if (applicabilityFunctions.length > 0) {
            // Constraint applies if only ALL applicability conditions are
            // met
            const applicability = constraint.applicabilityFunctions.every(applicabilityFn => applicabilityFn(node));

            // Skip this constraint if not applicable
            if (!applicability) {
                return;
            }
        }

        // Filter leaves
        const filteredLeaves = constraint.filterFunction(node, leaves);

        // Calculate cost
        const unweightedCost = constraint.costFunction(node, filteredLeaves, columnInfos);
        const cost = unweightedCost * constraint.constraint.weight;

        // Add cost in to total constraint cost
        constraintsCost += cost;
    });

    return baseCost + constraintsCost;
}

export function computeAndCacheCost(leaves: ReadonlyArray<AnnealNode.AnnealNode>, constraints: ReadonlyArray<ProcessedConstraint.ProcessedConstraint>, columnInfos: ReadonlyArray<ColumnInfo.ColumnInfo>, node: AnnealNode.AnnealNode) {
    const cost = computeCost(leaves, constraints, columnInfos, node);

    CostCache.insert(node, CostCache.init(cost));

    return cost;
}

export function sumChildrenCost(node: AnnealNode.AnnealNode) {
    let cost = 0;

    AnnealNode.forEachChild(node, (child) => {
        const costCache = CostCache.get(child);

        // Error if cost cache object not found
        if (costCache === undefined) {
            throw new Error("Expected cost cache object for node; object not found");
        }

        cost += costCache.cost;
    });

    return cost;
}

export function computeAndCacheStrataCost(leaves: ReadonlyArray<AnnealNode.AnnealNode>, constraints: ReadonlyArray<ProcessedConstraint.ProcessedConstraint>, columnInfos: ReadonlyArray<ColumnInfo.ColumnInfo>, nodes: ReadonlyArray<AnnealNode.AnnealNode>) {
    return nodes.map(node => computeAndCacheCost(leaves, constraints, columnInfos, node));
}
