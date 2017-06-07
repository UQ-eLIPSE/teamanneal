export class AnnealStratumNode {
    private workingSetView: Uint32Array;

    private offset: number; // In uint32 units (not bytes)
    private size: number;   // In uint32 units (not bytes)

    private cost: number | undefined = undefined;

    constructor(buffer: ArrayBuffer, offset: number, size: number) {
        // Create an array buffer view specifically for this node
        // The offset is multiplied by 4 because there are 4 bytes per uint32
        this.workingSetView = new Uint32Array(buffer, offset * 4, size);

        this.offset = offset;
        this.size = size;
    }

    public getRecordPointers() {
        return this.workingSetView;
    }

    public getOffset() {
        return this.offset;
    }

    public getSize() {
        return this.size;
    }

    public getCost() {
        return this.cost;
    }

    public setCost(cost: number) {
        return this.cost = cost;
    }

    public wipeCost() {
        return this.cost = undefined;
    }

    /**
     * Initialises a new AnnealStratumNode that points to the same contiguous
     * block of record pointers as the provided nodes.
     * 
     * A check is performed that the nodes are indeed contiguous and ordered.
     */
    public static initFromChildren(nodes: ReadonlyArray<AnnealStratumNode>) {
        let offset: number = 0;
        let size: number = 0;
        let buffer: ArrayBuffer | undefined;

        for (let i = 0; i < nodes.length; ++i) {
            const node = nodes[i];

            // If this is the first element, then we just set the properties
            // now, otherwise we do checks and append as necessary
            if (i === 0) {
                offset = node.offset;
                size = node.size;
                buffer = node.workingSetView.buffer;    // NOTE: Assumes all nodes have same underlying buffer
            } else {
                // Check that the start offset is contiguous
                if (node.offset !== offset + size) {
                    throw new Error("Nodes not contiguous");
                }

                // Increment size to expand the memory space covered
                size = size + node.size;
            }
        }

        if (buffer === undefined) {
            throw new Error("No buffer was extracted; possibly nodes array is empty");
        }

        return new AnnealStratumNode(buffer, offset, size);
    }

    /**
     * Determines whether a given array buffer view index falls within the range
     * of the working set of the node.
     */
    public isIndexInRange(i: number) {
        return (i >= this.offset) && (i < (this.offset + this.size));
    }

    /** 
     * Determines whether a given node covers a subset of record pointers that
     * the current node instance covers.
     * 
     * For example, if you have:
     * 
     *      [----- S1A -----] [----- S1B -----]     Stratum1
     *      [S0A] [S0B] [S0C] [S0D] [S0E] [S0F]     Stratum0
     *       0,1,  2,3,  4,5,  6,7,  8,9, 10,11     Record pointers
     * 
     * then:
     * 
     *      S1A.isNodeInRange(S0C) = true
     *      S1B.isNodeInRange(S0A) = false
     */
    public isNodeInRange(node: AnnealStratumNode) {
        // Check that the offset and size falls within the current instance's
        // boundary

        // Subsets must not start before of this' offset
        if (node.offset < this.offset) { return false; }

        // Subsets must fall completely within this' boundary
        if ((node.offset + node.size) > (this.offset + this.size)) { return false; }

        return true;
    }
}
