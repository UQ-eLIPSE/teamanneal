import * as AnnealNode from "../AnnealNode";

describe("`init`", () => {
    let dataObj: object;
    let initObj: AnnealNode.AnnealNode;

    beforeEach(() => {
        // New object for each initialisation of an AnnealNode
        dataObj = {};
        initObj = AnnealNode.init();
    });

    test("returns something", () => {
        expect(initObj).toBeDefined();
    });

    test("output.pointer is `undefined`", () => {
        expect(initObj.pointer).toBeUndefined();
    });

    test("output.parent is `undefined`", () => {
        expect(initObj.parent).toBeUndefined();
    });

    test("output.children is `undefined`", () => {
        expect(initObj.child).toBeUndefined();
    });

    test("output.childrenSize is 0", () => {
        expect(initObj.childrenSize).toBe(0);
    });

    test("output.next and output.prev points to itself", () => {
        expect(initObj.next).toBe(initObj);
        expect(initObj.prev).toBe(initObj);
    });
});

describe("`hasSiblings`", () => {
    test("should be `false` on newly initialised node", () => {
        const node = AnnealNode.init();
        expect(AnnealNode.hasSiblings(node)).toBe(false);
    });

    test("should be `true` for nodes with siblings", () => {
        const objs = [{}, {}].map(AnnealNode.init);

        const rootNode = AnnealNode.createNodeFromChildrenArray(objs);
        const firstChild = rootNode.child;

        expect(AnnealNode.hasSiblings(firstChild)).toBe(true);
    });
});

describe("`createNodeFromChildrenArray`", () => {
    test("creates a new root node with supplied nodes assigned as children", () => {
        const children = [{}, {}, {}].map(AnnealNode.init);

        const rootNode = AnnealNode.createNodeFromChildrenArray(children);

        expect(rootNode).toBeDefined();

        // There are three children
        expect(rootNode.childrenSize).toBe(3);

        const child1 = rootNode.child;
        const child2 = child1.next;
        const child3 = child2.next;

        // Children are actually in there
        expect(children).toContain(child1);
        expect(children).toContain(child2);
        expect(children).toContain(child3);

        // Circular linked list
        expect(child3.next).toBe(child1);
        expect(child1.prev).toBe(child3);

        // Parents are set
        expect(child1.parent).toBe(rootNode);
        expect(child2.parent).toBe(rootNode);
        expect(child3.parent).toBe(rootNode);
    });

    test("creates empty root node when array is blank", () => {
        const children: AnnealNode.AnnealNode[] = [];

        const rootNode = AnnealNode.createNodeFromChildrenArray(children);

        expect(rootNode).toBeDefined();
        expect(rootNode.childrenSize).toBe(0);

        expect(rootNode.child).toBeUndefined();
    });
});

describe("`pickRandomChild`", () => {
    test("returns undefined if parent does not have children", () => {
        const parent = AnnealNode.createNodeFromChildrenArray([]);
        const randomChild = AnnealNode.pickRandomChild(parent);

        expect(randomChild).toBeUndefined();
    });
});

describe("`pickRandomSibling`", () => {
    test("throws if parent is not defined on node", () => {
        const node = AnnealNode.init();
        expect(() => AnnealNode.pickRandomSibling(node)).toThrowError();
    });

    test("returns undefined if node does not have siblings", () => {
        const children = [AnnealNode.init()];
        const parent = AnnealNode.createNodeFromChildrenArray(children);

        const randomSibling = AnnealNode.pickRandomSibling(children[0]);

        expect(randomSibling).toBeUndefined();
    });
});

describe("`swapNodes`", () => {
    test("swaps child nodes between two parents", () => {
        const childrenA = [{}, {}, {}].map(AnnealNode.init);
        const childrenB = [{}, {}, {}].map(AnnealNode.init);

        const parentA = AnnealNode.createNodeFromChildrenArray(childrenA);
        const parentB = AnnealNode.createNodeFromChildrenArray(childrenB);

        // Pick two children, one from each parent
        const nodeA = childrenA[1];
        const nodeB = childrenB[1];

        // Perform swap
        AnnealNode.swapNodes(nodeA, nodeB);

        // Go through each parent and check nodeA/B sit under expected parent
        const nodesUnderParentA = [];
        const nodesUnderParentB = [];

        AnnealNode.forEachChild(parentA, (node) => nodesUnderParentA.push(node));
        AnnealNode.forEachChild(parentB, (node) => nodesUnderParentB.push(node));

        expect(nodesUnderParentA).toEqual(expect.arrayContaining([
            childrenA[0],
            nodeB,
            childrenA[2],
        ]));

        expect(nodesUnderParentB).toEqual(expect.arrayContaining([
            childrenB[0],
            nodeA,
            childrenB[2],
        ]));
    });

    test("swaps child nodes between two parents, where child nodes are immediate children attached under the parent's `.child` property", () => {
        const childrenA = [{}, {}, {}].map(AnnealNode.init);
        const childrenB = [{}, {}, {}].map(AnnealNode.init);

        const parentA = AnnealNode.createNodeFromChildrenArray(childrenA);
        const parentB = AnnealNode.createNodeFromChildrenArray(childrenB);

        // Pick two children, one from each parent
        const nodeA = childrenA[0];
        const nodeB = childrenB[0];

        // Perform swap
        AnnealNode.swapNodes(nodeA, nodeB);

        // Go through each parent and check nodeA/B sit under expected parent
        const nodesUnderParentA = [];
        const nodesUnderParentB = [];

        AnnealNode.forEachChild(parentA, (node) => nodesUnderParentA.push(node));
        AnnealNode.forEachChild(parentB, (node) => nodesUnderParentB.push(node));

        expect(nodesUnderParentA).toEqual(expect.arrayContaining([
            nodeB,
            childrenA[1],
            childrenA[2],
        ]));

        expect(nodesUnderParentB).toEqual(expect.arrayContaining([
            nodeA,
            childrenB[1],
            childrenB[2],
        ]));
    });

    test("swapping of node under same parent does not do anything", () => {
        const children = [{}, {}, {}].map(AnnealNode.init);

        const parent = AnnealNode.createNodeFromChildrenArray(children);

        // Pick two children under same parent
        const nodeA = children[0];
        const nodeB = children[1];
        const nodeC = children[2];

        // Perform "swap" of A and C
        AnnealNode.swapNodes(nodeA, nodeC);

        // Nothing should have occurred - .next/.prev order should be same
        expect(nodeA.parent).toBe(parent);
        expect(nodeB.parent).toBe(parent);
        expect(nodeC.parent).toBe(parent);

        expect(nodeA.next).toBe(nodeB);
        expect(nodeB.next).toBe(nodeC);
        expect(nodeC.next).toBe(nodeA);

        expect(nodeA.prev).toBe(nodeC);
        expect(nodeB.prev).toBe(nodeA);
        expect(nodeC.prev).toBe(nodeB);
    });
});

describe("`moveNode`", () => {
    test("moves child node to another parent", () => {
        const childrenA = [{}, {}, {}].map(AnnealNode.init);
        const childrenB = [{}, {}, {}].map(AnnealNode.init);

        const parentA = AnnealNode.createNodeFromChildrenArray(childrenA);
        const parentB = AnnealNode.createNodeFromChildrenArray(childrenB);

        // Pick child
        const nodeA = childrenA[1];

        // Perform move to parentB
        AnnealNode.moveNode(parentB, nodeA);

        // Go through each parent and check nodeA/B sit under expected parent
        const nodesUnderParentA = [];
        const nodesUnderParentB = [];

        AnnealNode.forEachChild(parentA, (node) => nodesUnderParentA.push(node));
        AnnealNode.forEachChild(parentB, (node) => nodesUnderParentB.push(node));

        expect(nodesUnderParentA).toEqual(expect.arrayContaining([
            childrenA[0],
            childrenA[2],
        ]));

        expect(nodesUnderParentB).toEqual(expect.arrayContaining([
            childrenB[0],
            childrenB[1],
            childrenB[2],
            nodeA,
        ]));

        // Children size should update
        expect(parentA.childrenSize).toBe(2);
        expect(parentB.childrenSize).toBe(4);
    });

    test("move child node to another parent, where child node is immediate child attached under the parent's `.child` property", () => {
        const childrenA = [{}, {}, {}].map(AnnealNode.init);
        const childrenB = [{}, {}, {}].map(AnnealNode.init);

        const parentA = AnnealNode.createNodeFromChildrenArray(childrenA);
        const parentB = AnnealNode.createNodeFromChildrenArray(childrenB);

        // Pick child
        const nodeA = childrenA[0];

        // Perform move to parentB
        AnnealNode.moveNode(parentB, nodeA);

        // Go through each parent and check nodeA/B sit under expected parent
        const nodesUnderParentA = [];
        const nodesUnderParentB = [];

        AnnealNode.forEachChild(parentA, (node) => nodesUnderParentA.push(node));
        AnnealNode.forEachChild(parentB, (node) => nodesUnderParentB.push(node));

        expect(nodesUnderParentA).toEqual(expect.arrayContaining([
            childrenA[1],
            childrenA[2],
        ]));

        expect(nodesUnderParentB).toEqual(expect.arrayContaining([
            childrenB[0],
            childrenB[1],
            childrenB[2],
            nodeA,
        ]));

        // Children size should update
        expect(parentA.childrenSize).toBe(2);
        expect(parentB.childrenSize).toBe(4);
    });

    test("move child node to another parent, where child node is only child attached under the parent", () => {
        const childrenA = [{}].map(AnnealNode.init);
        const childrenB = [{}, {}, {}].map(AnnealNode.init);

        const parentA = AnnealNode.createNodeFromChildrenArray(childrenA);
        const parentB = AnnealNode.createNodeFromChildrenArray(childrenB);

        // Pick child
        const nodeA = childrenA[0];

        // Perform move to parentB
        AnnealNode.moveNode(parentB, nodeA);

        // Go through each parent and check nodeA/B sit under expected parent
        const nodesUnderParentA = [];
        const nodesUnderParentB = [];

        AnnealNode.forEachChild(parentA, (node) => nodesUnderParentA.push(node));
        AnnealNode.forEachChild(parentB, (node) => nodesUnderParentB.push(node));

        expect(nodesUnderParentA).toHaveLength(0);
        expect(nodesUnderParentB).toEqual(expect.arrayContaining([
            childrenB[0],
            childrenB[1],
            childrenB[2],
            nodeA,
        ]));

        // Children size should update
        expect(parentA.childrenSize).toBe(0);
        expect(parentB.childrenSize).toBe(4);

        // parentA.child reference should be "undefined"
        expect(parentA.child).toBeUndefined();
    });

    test("moving of node under same parent does not do anything", () => {
        const children = [{}, {}, {}].map(AnnealNode.init);

        const parent = AnnealNode.createNodeFromChildrenArray(children);

        const nodeA = children[0];
        const nodeB = children[1];
        const nodeC = children[2];

        // Perform "move" to parent
        AnnealNode.moveNode(parent, nodeB);

        // Nothing should have occurred - .next/.prev order should be same
        expect(nodeA.parent).toBe(parent);
        expect(nodeB.parent).toBe(parent);
        expect(nodeC.parent).toBe(parent);

        expect(nodeA.next).toBe(nodeB);
        expect(nodeB.next).toBe(nodeC);
        expect(nodeC.next).toBe(nodeA);

        expect(nodeA.prev).toBe(nodeC);
        expect(nodeB.prev).toBe(nodeA);
        expect(nodeC.prev).toBe(nodeB);
    });
});

describe("`forEachChild`", () => {
    test("actually goes through each child of parent", () => {
        const children = [{}, {}, {}].map(AnnealNode.init);

        const parent = AnnealNode.createNodeFromChildrenArray(children);

        const nodesInParent = [];

        AnnealNode.forEachChild(parent, (node) => nodesInParent.push(node));

        expect(nodesInParent).toHaveLength(children.length);
        expect(nodesInParent).toEqual(expect.arrayContaining(children));
    });

    test("works as expected on node with no children", () => {
        const node = AnnealNode.createNodeFromChildrenArray([]);

        const fn = jest.fn();
        AnnealNode.forEachChild(node, fn);

        // The callback function should not have been called
        expect(fn).not.toHaveBeenCalled();
    });
});

describe("`forEachSibling`", () => {
    test("actually goes through each sibling of node", () => {
        // Note that forEachSibling also returns the selected node itself

        const children = [{}, {}, {}].map(AnnealNode.init);

        const parent = AnnealNode.createNodeFromChildrenArray(children);

        // Selected node
        const node = children[1];

        const siblingNodes = [];

        AnnealNode.forEachSibling(node, (sibling) => siblingNodes.push(sibling));

        expect(siblingNodes).toHaveLength(children.length);
        expect(siblingNodes).toEqual(expect.arrayContaining(children));
    });

    test("throws when the node has no parent", () => {
        const children = [{}, {}, {}].map(AnnealNode.init);

        // Selected node
        const node = children[1];

        expect(() => AnnealNode.forEachSibling(node, () => { })).toThrowError();
    });
});

describe("`isDescendantOf`", () => {
    // TODO:
});

describe("`exportState`", () => {
    test("exported state matches tree", () => {
        // Build tree
        const childrenA = [{}, {}, {}].map(AnnealNode.init);
        const childrenB = [{}, {}, {}].map(AnnealNode.init);

        const parentA = AnnealNode.createNodeFromChildrenArray(childrenA);
        const parentB = AnnealNode.createNodeFromChildrenArray(childrenB);

        const rootNode = AnnealNode.createNodeFromChildrenArray([parentA, parentB]);

        // Export state
        const exportedState = AnnealNode.exportState(rootNode);

        // Check that exported state is correct by going through all nodes
        const allNodes = [...childrenA, ...childrenB, parentA, parentB, rootNode];

        allNodes.forEach(
            (node) => {
                // Get state object
                const stateObj = exportedState.get(node.id);

                // Match up properties
                expect(stateObj.child).toBe(node.child);
                expect(stateObj.childrenSize).toBe(node.childrenSize);
                expect(stateObj.parent).toBe(node.parent);
                expect(stateObj.next).toBe(node.next);
                expect(stateObj.prev).toBe(node.prev);
            }
        );
    });

    test("exported state does not change when tree mutates", () => {
        // Build tree
        const childrenA = [{}, {}, {}].map(AnnealNode.init);
        const childrenB = [{}, {}, {}].map(AnnealNode.init);

        const parentA = AnnealNode.createNodeFromChildrenArray(childrenA);
        const parentB = AnnealNode.createNodeFromChildrenArray(childrenB);

        const rootNode = AnnealNode.createNodeFromChildrenArray([parentA, parentB]);

        // Export state
        const exportedState = AnnealNode.exportState(rootNode);

        // Save references to select properties
        const childrenA1_next = childrenA[1].next;
        const childrenA1_prev = childrenA[1].prev;
        const childrenB1_next = childrenB[1].prev;
        const childrenB1_prev = childrenB[1].prev;

        const parentB_child = parentB.child;

        // Mutate tree
        AnnealNode.swapNodes(childrenA[1], childrenB[1]);
        AnnealNode.moveNode(parentA, childrenB[0]);

        // Go through exported state and match up with pre-mutation references
        const exported_childrenA1 = exportedState.get(childrenA[1].id);
        const exported_childrenB1 = exportedState.get(childrenB[1].id);
        const exported_parentB = exportedState.get(parentB.id);

        expect(exported_childrenA1.next).toBe(childrenA1_next);
        expect(exported_childrenA1.prev).toBe(childrenA1_prev);
        expect(exported_childrenB1.prev).toBe(childrenB1_next);
        expect(exported_childrenB1.prev).toBe(childrenB1_prev);

        expect(exported_parentB.child).toBe(parentB_child);
    });
});

describe("`importState`", () => {
    test("state after application matches original exported state", () => {
        // Build tree
        const childrenA = [{}, {}, {}].map(AnnealNode.init);
        const childrenB = [{}, {}, {}].map(AnnealNode.init);

        const parentA = AnnealNode.createNodeFromChildrenArray(childrenA);
        const parentB = AnnealNode.createNodeFromChildrenArray(childrenB);

        const rootNode = AnnealNode.createNodeFromChildrenArray([parentA, parentB]);

        // Export state
        const exportedState = AnnealNode.exportState(rootNode);

        // Mutate tree
        AnnealNode.swapNodes(childrenA[1], childrenB[1]);
        AnnealNode.moveNode(parentA, childrenB[0]);
        AnnealNode.swapNodes(childrenA[0], childrenB[2]);
        AnnealNode.moveNode(parentB, childrenA[2]);

        // Reapply state
        AnnealNode.importState(rootNode, exportedState);

        // Check that new state is same as exported by going through all nodes
        const allNodes = [...childrenA, ...childrenB, parentA, parentB, rootNode];

        allNodes.forEach(
            (node) => {
                // Get state object
                const stateObj = exportedState.get(node.id);

                // Match up properties
                expect(node.child).toBe(stateObj.child);
                expect(node.childrenSize).toBe(stateObj.childrenSize);
                expect(node.parent).toBe(stateObj.parent);
                expect(node.next).toBe(stateObj.next);
                expect(node.prev).toBe(stateObj.prev);
            }
        );
    });
});



/// =========================
/// Tests that may be skipped
/// =========================
// This test set is skipped and shall only be run where necessary;
// This is because the randomness can only be tested by running over a large
// number of trials which consumes a fair bit of time
describe.skip("## Long running tests ##", () => {
    describe("`pickRandomChild`", () => {
        test("picks an actual child in each of 1e6 runs", () => {
            const children = [{}, {}, {}].map(AnnealNode.init);
            const parent = AnnealNode.createNodeFromChildrenArray(children);

            const set = new Set<AnnealNode.AnnealNode>();
            const numberOfRuns = 1e6;

            for (let i = 0; i < numberOfRuns; ++i) {
                set.add(AnnealNode.pickRandomChild(parent));
            }

            // We should expect coverage across the entire set of children over
            // 1e6 runs
            expect(set.size).toBe(children.length);

            set.forEach((node) => {
                expect(children).toContain(node);
            });
        });
    });

    describe("`pickRandomSibling`", () => {
        test("picks an actual sibling in each of 1e6 runs", () => {
            const children = [{}, {}, {}, {}, {}].map(AnnealNode.init);
            const targetNode = children[1]; // The node to search siblings for

            // Create an artificial parent (unused, but required for function)
            AnnealNode.createNodeFromChildrenArray(children);

            const set = new Set<AnnealNode.AnnealNode>();
            const numberOfRuns = 1e6;

            for (let i = 0; i < numberOfRuns; ++i) {
                set.add(AnnealNode.pickRandomSibling(targetNode));
            }

            // We should expect coverage across the entire set of children over
            // 1e6 runs
            expect(set.size).toBe(children.length - 1);

            set.forEach((node) => {
                expect(children).toContain(node);
                expect(node).not.toBe(targetNode);
            });
        });
    });
});
