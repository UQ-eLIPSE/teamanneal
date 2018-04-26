import * as Random from "./Random";

import { AnnealStratumNode } from "./AnnealStratumNode";

import { AbstractConstraint } from "./AbstractConstraint";

export class AnnealStratum {
    public readonly id: string;
    public readonly nodes: ReadonlyArray<AnnealStratumNode>;
    public readonly constraints: ReadonlyArray<AbstractConstraint>;

    constructor(id: string, nodes: ReadonlyArray<AnnealStratumNode>, constraints: ReadonlyArray<AbstractConstraint>) {
        this.id = id;
        this.nodes = nodes;
        this.constraints = constraints;
    }

    public randomSwapRecordPointersBetweenNodes() {
        const numberOfNodes = this.nodes.length;

        if (numberOfNodes < 2) {
            throw new Error("Cannot perform swap of records with fewer than 2 nodes");
        }

        // `nodeAIndex` is selected at random;
        // `nodeBIndex` is selected by running by a random offset in a circular
        // fashion up to but not leading back to `nodeAIndex`
        const nodeAIndex = (Random.randomLong() * numberOfNodes) >>> 0;
        const offsetToB = ((Random.randomLong() * (numberOfNodes - 1)) >>> 0) + 1; // Minimum offset is 1
        const nodeBIndex = (nodeAIndex + offsetToB) % numberOfNodes;

        // Get two nodes
        const nodeA = this.nodes[nodeAIndex];
        const nodeB = this.nodes[nodeBIndex];

        // Get working views of each
        const viewA = nodeA.getRecordPointers();
        const viewB = nodeB.getRecordPointers();

        // Pick two indicies
        const indexA = (Random.randomLong() * viewA.length) >>> 0;
        const indexB = (Random.randomLong() * viewB.length) >>> 0;

        // Swap
        const pointerA = viewA[indexA];
        viewA[indexA] = /* pointerB */ viewB[indexB];
        viewB[indexB] = pointerA;

        // Return the array buffer's global indices to the swapped elements
        return [indexA + nodeA.getOffset(), indexB + nodeB.getOffset()];
    }
}
