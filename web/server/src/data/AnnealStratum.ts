import * as Record from "../../../common/Record";
import * as Stratum from "../../../common/Stratum";
import * as AnnealNode from "../../../common/AnnealNode";


import * as Random from "./Random";
import * as Data_AnnealNode from "./AnnealNode";
import { AnnealStratumNode } from "./AnnealStratumNode";
import { AbstractConstraint } from "./AbstractConstraint";
import { AnnealRecordPointerArray } from "./AnnealRecordPointerArray";

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

    /**
     * Bundles one stratum's `AnnealStratumNode`s into an `AnnealStratum` 
     * object.
     * 
     * @param constraints
     * @param strataDefinitions 
     * @param stratumNodes 
     * @param stratumIndex Index of the stratum being formed, where 0 = leaf stratum
     */
    public static bundleStratumNodes(constraints: ReadonlyArray<AbstractConstraint>, strataDefinitions: ReadonlyArray<Stratum.Desc>, stratumNodes: ReadonlyArray<AnnealStratumNode>, stratumIndex: number) {
        const stratumId = strataDefinitions[stratumIndex]._id;
        const stratumConstraints = constraints.filter(c => c.constraintDef.stratum === stratumId);
        return new AnnealStratum(stratumId, stratumNodes, stratumConstraints);
    }

    /**
     * Creates a set of strata (`AnnealStratum[]`), record pointers
     * (`AnnealRecordPointerArray`) and a map between client-provided anneal 
     * nodes to the algorithm internal `AnnealStratumNode`s.
     * 
     * @param constraints 
     * @param strataDefinitions 
     * @param annealNodeToStratumNodeMap Map between anneal node (from the request) to stratum node (used internally in the anneal) (will be filled after running this function)
     * @param recordPointers 
     * @param recordIdColumn Array with just the ID values of the records, in the order that the records appear 
     * @param rootNode 
     */
    public static createStrataSet(constraints: ReadonlyArray<AbstractConstraint>, strataDefinitions: ReadonlyArray<Stratum.Desc>, recordIdColumn: ReadonlyArray<Record.RecordElement>, rootNode: AnnealNode.NodeRoot) {
        const numberOfRecordsUnderNode = recordIdColumn.length;

        // Create record pointer array
        console.log("Creating record pointers...");
        const recordPointers = new AnnealRecordPointerArray(numberOfRecordsUnderNode);

        // Maps node to respective stratum node
        const annealNodeToStratumNodeMap = new WeakMap<AnnealNode.Node, AnnealStratumNode>();

        // Maps node to a number which represents the total number of records that
        // sit under it
        const nodeSizeMap = Data_AnnealNode.generateNodeSizeMap(rootNode);

        // Quick sanity check to make sure that we do indeed have the correct number
        // of records in tree
        const rootNodeSize = nodeSizeMap.get(rootNode);

        if (rootNodeSize !== numberOfRecordsUnderNode) {
            throw new Error("Number of records in node tree do not match length of records indicated as that being under node");
        }

        // Store stratum nodes into linear array where each element is one "level";
        // - index 0 is the lowest level = leaf nodes containing the records,
        // - index (end) is the highest level
        const nodesPerStratum: AnnealStratumNode[][] = [];

        // Prepopulate blank strata node arrays
        for (let i = 0; i < strataDefinitions.length; ++i) {
            nodesPerStratum.push([]);
        }

        // Function does three things:
        // - Generate the stratum nodes,
        // - Set stratum nodes into the node to stratum node map,
        // - Sets record pointers into record pointer array
        AnnealStratumNode.generateStratumNodes(recordPointers.workingSet, recordIdColumn, nodeSizeMap, annealNodeToStratumNodeMap, nodesPerStratum, rootNode, strataDefinitions.length - 1, 0);

        // Bundle the stratum nodes into AnnealStratum objects
        const strata: ReadonlyArray<AnnealStratum> = nodesPerStratum.map((stratumNodes, i) => AnnealStratum.bundleStratumNodes(constraints, strataDefinitions, stratumNodes, i));

        return {
            recordPointers,
            annealNodeToStratumNodeMap,
            strata,
        };
    }
}
