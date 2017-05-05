import * as AnnealNode from "./AnnealNode";

/**
 * Object that holds cached cost information for some AnnealNode.
 */
export interface CostCache {
    /** Total calculated cost for this node, incl. children */
    readonly cost: number,
}

interface CostCacheUnsafe {
    /** Total calculated cost for this node, incl. children */
    cost: number,
}

/**
 * WeakMap as a cache for AnnealNode -> Cost.
 */
let __costCache: WeakMap<AnnealNode.AnnealNode, CostCache> = new WeakMap();

/** 
 * This is a reference prototype so that some JavaScript engines can better optimise property
 * lookups against all CostCache objects.
 * 
 * This seems to be particularly true of V8 (Chrome/Node.js).
 */
const __rootPrototype = Object.create(null);

/**
 * Initialises a new CostCache object.
 */
export function init(cost: number) {
    const costCacheObj: CostCacheUnsafe = Object.create(__rootPrototype);

    costCacheObj.cost = cost;

    return costCacheObj as CostCache;
}

export function get(node: AnnealNode.AnnealNode) {
    return __costCache.get(node);
}

export function remove(node: AnnealNode.AnnealNode) {
    return __costCache.delete(node);
}

export function has(node: AnnealNode.AnnealNode) {
    return __costCache.has(node);
}

/**
 * Adds cost object to cost cache against given node.
 * 
 * Insertions where the given node already has a cached cost value are not
 * permitted and will throw an error.
 */
export function insert(node: AnnealNode.AnnealNode, cost: CostCache) {
    // Prevent double insertions
    if (has(node)) {
        throw new Error("Node already has value in cost cache");
    }

    __costCache.set(node, cost);

    return;
}

/**
 * Invalidates cost cache for given node and all nodes up to the root.
 * 
 * @returns Array of nodes with invalidated costs.
 */
export function invalidate(node: AnnealNode.AnnealNode) {
    let currentNode: AnnealNode.AnnealNode | undefined = node;

    const nodesWithInvalidatedCosts: AnnealNode.AnnealNode[] = [];

    do {
        remove(currentNode);
        nodesWithInvalidatedCosts.push(currentNode);
    } while (currentNode = currentNode.parent); // Go up the tree

    return nodesWithInvalidatedCosts;
}

/**
 * Invalidates all costs cached.
 */
export function invalidateAll() {
    // There is no "clear" method on WeakMaps, you simply instantiate a new
    // WeakMap object instead
    __costCache = new WeakMap();   
}
