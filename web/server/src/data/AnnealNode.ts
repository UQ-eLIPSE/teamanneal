/**
 * An abstract node that represents the location of a node (a partition, group,
 * student, etc.) in various strata for TeamAnneal.
 * 
 * This is implemented in a tree with a circular doubly-linked list between
 * siblings.
 */
export interface AnnealNode extends __AnnealNode {
    /** Actual bit of data that this abstract node refers to */
    readonly data: object,
}

interface AnnealNodeUnsafe extends __AnnealNode {
    /** Actual bit of data that this abstract node refers to */
    data: object,
}

interface __AnnealNode {
    /** The parent */
    parent: AnnealNode | undefined,
    /** Any one child */
    child: AnnealNode | undefined,
    /** The number of children */
    childrenSize: number,

    /** The next sibling */
    next: AnnealNode,
    /** The previous sibling */
    prev: AnnealNode,
}

/**
 * Callback function for "forEach" functions.
 * 
 * Note that the `index` value should not be taken as an actual static lookup
 * index, as AnnealNodes are stored in linked lists and indicies are are
 * subject to change with swap/move operations.
 */
type AnnealNodeLoopCallback = (node: AnnealNode, index?: number) => void;

/** 
 * This is a reference prototype so that some JavaScript engines can better optimise property
 * lookups against all AnnealNodes.
 * 
 * This seems to be particularly true of V8 (Chrome/Node.js).
 */
const __rootPrototype = Object.create(null);

/**
 * Initialises a new AnnealNode object.
 */
export function init(data: object) {
    const node: AnnealNodeUnsafe = Object.create(__rootPrototype);

    node.data = data;
    node.parent = undefined;
    node.child = undefined;
    node.childrenSize = 0;
    node.next = node;
    node.prev = node;

    return node as AnnealNode;
}

/**
 * Calculates the next circular index in an array.
 */
const indexNext = (arraySize: number) => (currentIndex: number) => {
    return (currentIndex + 1) % arraySize;
}

/**
 * Calculates the previous circular index in an array.
 */
const indexPrev = (arraySize: number) => (currentIndex: number) => {
    // We add by `arraySize` because the index may be -1
    return (currentIndex + arraySize - 1) % arraySize;
}

/**
 * Returns whether given node has siblings.
 */
export function hasSiblings(node: AnnealNode) {
    // Check that we have some other node besides us
    // An extended proof is provided at http://elipse-jira.uqcloud.net/confluence/display/~uqjli23/Checking+that+a+circular+linked+list+node+has+siblings
    return node.next !== node;
}

/**
 * Creates a new AnnealNode with given array as children.
 * The data object pointed to by the AnnealNode is the array object itself.
 */
export function createNodeFromChildrenArray(nodeArray: AnnealNode[]) {
    // Create a new AnnealNode, using the input array as the "data" object
    const parentNode = init(nodeArray);

    // Set all nodes as siblings of each other
    setAsSiblings(nodeArray);

    // Set child <-> parent references
    setAsChildrenOf(parentNode, nodeArray);

    return parentNode;
}

/**
 * Sets all nodes in array as siblings of each other.
 */
function setAsSiblings(nodeArray: AnnealNode[]) {
    const nodeArrayLength = nodeArray.length;

    // Pre-applied next/prev index calculation functions
    const next = indexNext(nodeArrayLength);
    const prev = indexPrev(nodeArrayLength);

    // Go through all array elements, set next/prev doubly linked references
    for (let i = 0; i < nodeArrayLength; ++i) {
        const childNode = nodeArray[i];
        childNode.next = nodeArray[next(i)];
        childNode.prev = nodeArray[prev(i)];
    }

    return nodeArray;
}

/**
 * Sets all nodes in array as the only children of `parent`.
 */
function setAsChildrenOf(parent: AnnealNode, nodeArray: AnnealNode[]) {
    // Set child.parent reference
    nodeArray.forEach(node => node.parent = parent);

    // Set parent.child reference, children set size
    parent.child = nodeArray[0];        // If nodeArray is blank, this will set "undefined"
    parent.childrenSize = nodeArray.length;

    return nodeArray;
}

/**
 * Picks a random child under the given parent node.
 */
export function pickRandomChild(parent: AnnealNode) {
    const childIndex = (Math.random() * parent.childrenSize) >>> 0;
    let childNode = parent.child;

    if (childNode) {
        for (let i = 0; i < childIndex; ++i) {
            childNode = childNode.next;
        }
    }

    return childNode;
}

/**
 * Picks a random sibling of the given node.
 * 
 * The given node must have a parent defined.
 */
export function pickRandomSibling(node: AnnealNode) {
    // Calculate an offset in the range [1, size - 1], and run along the linked
    // list from `node` by this offset.
    //
    // For example, with a list of size 5:
    //
    //             --> A <--> B <--> `node` <--> D <--> E <--
    //                        (pointer) ^ ----> (offset direction)
    //
    // Then `offset` is calculated in the range [1,4]. In the above example,
    // if we got `offset` = 3, then we would get A.
    //
    // This effectively emulates a pick from a set which never had the
    // `node` in the first place.
    const parent = node.parent;

    if (!parent) {
        throw new Error("No parent on supplied node");
    }

    // If there are no siblings, then return undefined
    if (!hasSiblings(node)) {
        return undefined;
    }

    const offset = ((Math.random() * (parent.childrenSize - 1)) >>> 0) + 1;
    let siblingNode = node;

    for (let i = 0; i < offset; ++i) {
        siblingNode = siblingNode.next;
    }

    return siblingNode;
}

/**
 * Swaps the two given nodes between their parents.
 */
export function swapNodes(nodeA: AnnealNode, nodeB: AnnealNode) {
    const nextA = nodeA.next;
    const prevA = nodeA.prev;
    const parentA = nodeA.parent;

    const nextB = nodeB.next;
    const prevB = nodeB.prev;
    const parentB = nodeB.parent;

    // If parents are same, swapping in a set does nothing
    // Also, if nodeA and nodeB are indeed siblings (have same parent) there is
    // the possibility of the nextA/B and prevA/B references to point to each
    // other, resulting in invalid prev/next references.
    if (parentA === parentB) {
        return;
    }


    // This function transforms this:
    //         --> prevA <--> *nodeA* <--> nextA <--
    //         --> prevB <--> *nodeB* <--> nextB <--
    // ... to this:
    //         --> prevA <--> *nodeB* <--> nextA <--
    //         --> prevB <--> *nodeA* <--> nextB <--

    // Swap next/prev of siblings
    prevA.next = nodeB;
    nextA.prev = nodeB;

    prevB.next = nodeA;
    nextB.prev = nodeA;

    // Swap next/prev of the nodes themselves
    nodeB.next = nextA;
    nodeB.prev = prevA;

    nodeA.next = nextB;
    nodeA.prev = prevB;

    // Swap parent references
    nodeA.parent = parentB;
    nodeB.parent = parentA;

    // Change parent .child references if it points to any of the
    // swapped nodes
    if (parentA && parentA.child === nodeA) {
        parentA.child = nodeB;
    }

    if (parentB && parentB.child === nodeB) {
        parentB.child = nodeA;
    }

    // No need to change children size because the number of children
    // of each of the parents does not change

    return;
}

/**
 * Detaches node from parent, if assigned.
 */
function detachNode(node: AnnealNode) {
    const next = node.next;
    const prev = node.prev;
    const parent = node.parent;

    // Set the sibling references to each other only if neither
    // `next` nor `prev` references the node itself
    // 
    // If we do have siblings, then we need to update their .next/.prev
    // references as appropriate
    const nodeHasSiblings = hasSiblings(node);
    if (nodeHasSiblings) {
        prev.next = next;    // Set prev.next to now point to node.next
        next.prev = prev;    // Set next.prev to now point to node.prev
    }

    // Point next/prev to node itself (since it is now solitary)
    node.next = node;
    node.prev = node;

    // Erase parent reference
    node.parent = undefined;

    // Stop now if no parent was previously set
    if (!parent) {
        return node;
    }

    // If parent's .child reference points to `node`, then change reference
    // to another one of `node`'s siblings or erase it as appropriate
    if (parent.child === node) {
        if (nodeHasSiblings) {
            // Set to next sibling
            parent.child = next;
        } else {
            // Erase child reference
            parent.child = undefined;
        }
    }

    // Decrement parent children size by one
    parent.childrenSize -= 1;

    return node;
}

/**
 * Attaches node to `parent`.
 */
function attachNode(parent: AnnealNode, node: AnnealNode) {
    const child = parent.child;

    if (!child) {
        // If there is no child on `parent`, then attaching is simply to set
        // `node` as the child
        parent.child = node;
    } else {
        // Attach `node` as sibling to `child`
        //
        // So we're transforming:
        //
        //             parent
        //               |
        //               V
        //         --> child <--> childNext <--
        // ... to:
        //         --> child <--> node <--> childNext <--
        // 
        // This is used as it doesn't require changing any more references than
        // is necessary - if we put it as the immediate child of the parent
        // then that incurs an additional reference change; if we go any
        // further along the sibling linked list then that's pointless as we're
        // emulating a set here and order does not matter.
        //
        // Note that this also works in the case where child === childNext.
        const childNext = child.next;

        child.next = node;
        childNext.prev = node;

        node.prev = child;
        node.next = childNext;
    }

    // Set the node's parent to `parent`
    node.parent = parent;

    // Increment parent children size by one
    parent.childrenSize += 1;

    return node;
}

/**
 * Moves node to become a child under `newParent`.
 */
export function moveNode(newParent: AnnealNode, node: AnnealNode) {
    // If parents are same, moving in a set does nothing
    if (node.parent === newParent) {
        return node;
    }

    // Move by detaching and then attaching the node to a new parent
    return attachNode(newParent, detachNode(node));
}

/**
 * Runs `callback` for each child node under parent.
 */
export function forEachChild(parent: AnnealNode, callback: AnnealNodeLoopCallback) {
    let currentNode = parent.child;

    for (let i = 0; i < parent.childrenSize; ++i) {
        // If loop is executed, `currentNode` is defined
        callback(currentNode!, i);
        currentNode = currentNode!.next;
    }

    return;
}

/**
 * Runs `callback` for all siblings, including the given node itself. Note that
 * there is no guarantee about the loop execution order.
 * 
 * The given node must have a parent defined.
 */
export function forEachSibling(node: AnnealNode, callback: AnnealNodeLoopCallback) {
    const parent = node.parent;

    if (!parent) {
        throw new Error("No parent on supplied node");
    }

    return forEachChild(parent, callback);
}
