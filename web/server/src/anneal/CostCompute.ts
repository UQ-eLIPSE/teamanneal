import { AbstractConstraint } from "../data/AbstractConstraint";

import { AnnealStratum } from "../data/AnnealStratum";

export function computeCost(strata: ReadonlyArray<AnnealStratum>) {
    let cost: number = 0;

    for (let i = 0; i < strata.length; ++i) {
        const stratum = strata[i];
        const stratumCost = computeCostStratum(stratum);
        cost = cost + stratumCost;
    }

    return cost;
}

function computeCostStratum(stratum: AnnealStratum) {
    const nodes = stratum.nodes;
    const constraints = stratum.constraints;

    let cost: number = 0;

    for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i];

        // Used cache cost where available
        if (node.isCostSet()) {
            cost += node.getCost();
        } else {
            cost += node.setCost(
                computeCostRecords(constraints, node.getRecordPointers())
            );
        }
    }

    return cost;
}

function computeCostRecords(constraints: ReadonlyArray<AbstractConstraint>, recordPointers: Uint32Array) {
    let cost: number = 0;

    for (let i = 0; i < constraints.length; ++i) {
        cost += constraints[i].calculateWeightedCost(recordPointers);
    }

    return cost;
}

export function wipeAllCost(strata: ReadonlyArray<AnnealStratum>) {
    for (let i = 0; i < strata.length; ++i) {
        const nodes = strata[i].nodes;
        for (let j = 0; j < nodes.length; ++j) {
            nodes[j].wipeCost();
        }
    }
}

export function wipeCost(strata: ReadonlyArray<AnnealStratum>, recordPointerIndicies: ReadonlyArray<number>) {
    for (let i = 0; i < strata.length; ++i) {
        wipeCostStratum(strata[i], recordPointerIndicies);
    }
}

function wipeCostStratum(stratum: AnnealStratum, recordPointerIndicies: ReadonlyArray<number>) {
    const nodes = stratum.nodes;

    // Go through each node
    for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i];

        // Go through each index to wipe
        for (let j = 0; j < recordPointerIndicies.length; ++j) {
            const recordPointerIndex = recordPointerIndicies[j];

            if (node.isIndexInRange(recordPointerIndex)) {
                node.wipeCost();

                // We can break and move onto the next node, since this node is
                // now wiped and we no longer need to care about the remaining
                // record pointer indicies
                break;
            }
        }
    }
}
