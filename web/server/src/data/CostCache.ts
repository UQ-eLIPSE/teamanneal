import * as AnnealNode from "./AnnealNode";

/**
 * Object that holds cached cost information for some AnnealNode.
 */
export interface CostCache {
    /** Total calculated cost for this node, incl. children */
    readonly cost: number,
}

/**
 * WeakMap as a cache for AnnealNode -> Cost.
 */
const __costCache = new WeakMap<AnnealNode.AnnealNode, CostCache>();

export const get = __costCache.get;
export const remove = __costCache.delete;

/**
 * Initialises a new CostCache object.
 */
export function init(cost: number) {
    const costCacheObj: CostCache = {
        cost,
    };

    return costCacheObj;
}

/**
 * Adds cost object to cost cache against given node.
 * 
 * Insertions where the given node already has a cached cost value are not
 * permitted and will throw an error.
 */
export function insert(node: AnnealNode.AnnealNode, cost: CostCache) {
    // Prevent double insertions
    if (__costCache.has(node)) {
        throw new Error("Node already has value in cost cache");
    }

    __costCache.set(node, cost);

    return;
}

/**
 * Invalidates cost cache for given node and all nodes up to the root.
 */
export function invalidate(node: AnnealNode.AnnealNode) {
    let currentNode: AnnealNode.AnnealNode | undefined = node;

    do {
        remove(currentNode);
    } while (currentNode = currentNode.parent); // Go up the tree

    return;
}
