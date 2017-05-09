import * as CostCache from "../CostCache";

import * as AnnealNode from "../AnnealNode";

describe("`insert`", () => {
    let node: AnnealNode.AnnealNode;

    beforeEach(() => {
        node = AnnealNode.init({});
    })

    test("inserts a CostCache object", () => {
        const inputCost = 238974;

        CostCache.insert(node, inputCost);

        const returnedCost = CostCache.get(node);

        expect(returnedCost).toBe(inputCost);
    });

    test("cannot insert a CostCache object against a node more than once", () => {
        const inputCost = 3487654;

        // First time
        CostCache.insert(node, inputCost);

        // Second time (with any number)
        expect(() => CostCache.insert(node, 459873)).toThrowError();
    });
});

describe("`remove`", () => {
    let node: AnnealNode.AnnealNode;

    beforeEach(() => {
        node = AnnealNode.init({});
    })

    test("removes a CostCache object", () => {
        CostCache.insert(node, 0);
        expect(CostCache.has(node)).toBe(true);

        CostCache.remove(node);
        expect(CostCache.has(node)).toBe(false);
    });
});

describe("`invalidate`", () => {
    test("removes cost cache objects from node up to root", () => {
        // Create two strata of nodes
        //               Root
        //        S1a             S1b
        //     S2a  S2b         S2c  S2d

        // Assigning to `_` for convenience and readability
        const _ = (children) => AnnealNode.createNodeFromChildrenArray(children, undefined);

        // Construct nodes
        const s2a = _([]);
        const s2b = _([]);
        const s2c = _([]);
        const s2d = _([]);

        const s1a = _([s2a, s2b]);
        const s1b = _([s2c, s2d]);

        const root = _([s1a, s1b]);

        // Assign arbitrary cost object to all nodes
        const allNodes = [root, s1a, s1b, s2a, s2b, s2c, s2d];
        allNodes.forEach((node) => {
            CostCache.insert(node, 0);
        });

        // Invalidate from S2c -> S1b -> Root
        CostCache.invalidate(s2c);

        // These should be invalidated and not exist in cache
        expect(CostCache.get(root)).toBeUndefined();
        expect(CostCache.get(s1b)).toBeUndefined();
        expect(CostCache.get(s2c)).toBeUndefined();

        // These should still be in cache
        expect(CostCache.get(s1a)).toBeDefined();
        expect(CostCache.get(s2a)).toBeDefined();
        expect(CostCache.get(s2b)).toBeDefined();
        expect(CostCache.get(s2d)).toBeDefined();
    });
});
