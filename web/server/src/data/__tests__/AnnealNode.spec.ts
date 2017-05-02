import * as AnnealNode from "../AnnealNode";

describe("`init`", () => {
    let dataObj: object;
    let initObj: AnnealNode.AnnealNode;

    beforeEach(() => {
        // New object for each initialisation of an AnnealNode
        dataObj = {};
        initObj = AnnealNode.init(dataObj);
    });

    test("returns something", () => {
        expect(initObj).toBeDefined();
    });

    test("output.data is the given data object", () => {
        expect(initObj.data).toBe(dataObj);
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
        const node = AnnealNode.init({});
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

        // `data` is the array itself
        expect(rootNode.data).toBe(children);

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
        expect(rootNode.data).toBe(children);

        expect(rootNode.child).toBeUndefined();
    });
});

describe("`pickRandomChild`", () => { });
describe("`pickRandomSibling`", () => { });
describe("`swapNodes`", () => { });
describe("`moveNode`", () => { });
describe("`forEachChild`", () => { });
describe("`forEachSibling`", () => { });
