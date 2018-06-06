import * as Record from "../../../common/Record";
import * as AnnealNode from "../../../common/AnnealNode";

export class AnnealStratumNode {
    private readonly id: string;

    private readonly workingSetView: Uint32Array;
    private readonly cost: Float64Array;

    private offset: number; // In uint32 units (not bytes)
    private size: number;   // In uint32 units (not bytes)


    constructor(id: string, buffer: ArrayBuffer, offset: number, size: number) {
        // Create an array buffer view specifically for this node
        // NOTE: The offset is a normal element unit count, but the Uint32Array 
        //       constructor uses bytes!
        //       BYTES_PER_ELEMENT is used as the multiplier and its value 
        //       should be 4.
        this.workingSetView = new Uint32Array(buffer, offset * Uint32Array.BYTES_PER_ELEMENT, size);

        // Using Float64Array to store cost value for performance reasons
        this.cost = new Float64Array(1);
        this.wipeCost();

        this.id = id;
        this.offset = offset;
        this.size = size;
    }

    public getRecordPointers() {
        return this.workingSetView;
    }

    public getId() {
        return this.id;
    }

    public getOffset() {
        return this.offset;
    }

    public getSize() {
        return this.size;
    }

    public getCost() {
        return this.cost[0];
    }

    public setCost(cost: number) {
        return this.cost[0] = cost;
    }

    public isCostSet() {
        return !Number.isNaN(this.cost[0]);
    }

    public wipeCost() {
        return this.cost[0] = Number.NaN;
    }

    /**
     * Initialises a new AnnealStratumNode that points to the same contiguous
     * block of record pointers as the provided nodes.
     * 
     * A check is performed that the nodes are indeed contiguous and ordered.
     */
    public static initFromChildren(id: string, nodes: ReadonlyArray<AnnealStratumNode>) {
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

        return new AnnealStratumNode(id, buffer, offset, size);
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

    /**
     * Function does three things:
     * - Generate the stratum nodes,
     * - Set stratum nodes into the node to stratum node map,
     * - Sets record pointers into record pointer array.
     * 
     * You must supply an empty map for `sizeMap`, `annealNodeToStratumNodeMap`, and
     * empty nested arrays for `nodesPerStratum`.
     * 
     * @param pointerArrayWorkingSet The working set Uint32Array typed array
     * @param recordIdColumn Array with just the ID values of the records, in the order that the records appear
     * @param sizeMap Map between node and its size (will be filled after running this function)
     * @param annealNodeToStratumNodeMap Map between anneal node (from the request) to stratum node (used internally in the anneal) (will be filled after running this function)
     * @param nodesPerStratum Array holding the stratum nodes per stratum (will be filled after running this function)
     * @param node The node being operated on
     * @param stratumNumber The stratum number of the node being operated on
     * @param offset The pointer array offset being kept track of
     */
    public static generateStratumNodes(pointerArrayWorkingSet: Uint32Array, recordIdColumn: ReadonlyArray<Record.RecordElement>, sizeMap: WeakMap<AnnealNode.Node, number>, annealNodeToStratumNodeMap: WeakMap<AnnealNode.Node, AnnealStratumNode>, nodesPerStratum: ReadonlyArray<AnnealStratumNode[]>, node: AnnealNode.Node, stratumNumber: number, offset: number) {
        // Terminal case when no children are present
        if (node.type === "stratum-records") {
            // Convert records to their respective pointer values
            const recordPointers =
                node.recordIds.map((recordId) => {
                    // Pointer value is just the index of this particular record in
                    // the larger set of records
                    const pointerValue = recordIdColumn.indexOf(recordId);

                    if (pointerValue < 0) {
                        throw new Error(`Could not find node child record ID "${recordId}" in provided record ID column array`);
                    }

                    return pointerValue;
                });

            // Write the pointers for the above records into pointer array at offset
            pointerArrayWorkingSet.set(recordPointers, offset);

            return;
        }

        // Copy out working copy of offset for the children loop
        let workingOffset = offset;

        const children = node.children;

        children.forEach((childNode) => {
            // Get the precalculated sizes of each node from the given map
            const size = sizeMap.get(childNode);

            if (size === undefined) {
                throw new Error("Node size not found in precalculated map");
            }

            // Generate stratum node, put into map, and push into array
            const stratumNode = new AnnealStratumNode(childNode._id, pointerArrayWorkingSet.buffer, workingOffset, size);
            annealNodeToStratumNodeMap.set(childNode, stratumNode);
            nodesPerStratum[stratumNumber].push(stratumNode);

            // Recurse down
            //
            // Note that stratum number value goes down because strata are arranged 
            // [lowest, ..., highest] while we're recursing down a tree in
            // [highest, ..., lowest] order;
            AnnealStratumNode.generateStratumNodes(pointerArrayWorkingSet, recordIdColumn, sizeMap, annealNodeToStratumNodeMap, nodesPerStratum, childNode, stratumNumber - 1, workingOffset);

            // Update offset for next child
            workingOffset += size;
        });
    }
}
