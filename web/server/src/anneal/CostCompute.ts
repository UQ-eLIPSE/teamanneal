import { AbstractConstraint } from "./AbstractConstraint";
import { AnnealStratum } from "./AnnealStratum";

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
        const cachedCost = node.getCost();

        // Used cache cost where available
        if (cachedCost !== undefined) {
            cost = cost + cachedCost;
        } else {
            cost = cost + node.setCost(
                computeCostRecords(constraints, nodes[i].getRecordPointers())
            );
        }
    }

    return cost;
}

function computeCostRecords(constraints: ReadonlyArray<AbstractConstraint>, recordPointers: Uint32Array) {
    let cost: number = 0;

    for (let i = 0; i < constraints.length; ++i) {
        cost = cost + constraints[i].calculateWeightedCost(recordPointers);
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

    // Go through each index to wipe
    for (let i = 0; i < recordPointerIndicies.length; ++i) {
        const recordPointerIndex = recordPointerIndicies[i];

        // Go through each node
        for (let j = 0; j < nodes.length; ++j) {
            const node = nodes[j];

            if (node.isIndexInRange(recordPointerIndex)) {
                node.wipeCost();

                // A record pointer index will not be straddling across multiple
                // nodes; we can safely move on to the next record pointer index
                // to wipe
                break;
            }
        }
    }
}
