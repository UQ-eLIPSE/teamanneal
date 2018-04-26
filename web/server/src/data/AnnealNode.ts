import * as Record from "../../../common/Record";
import * as AnnealNode from "../../../common/AnnealNode";

import { AnnealStratumNode } from "./AnnealStratumNode";

/**
 * Generates output tree to send back to client.
 * 
 * @param recordIdColumn Array of records ID column data in the same order as the original record set
 * @param annealNodeToStratumNodeMap Map between anneal node (from the request) to stratum node (used internally in the anneal)
 * @param node The node being operated on
 */
export function generateTree(recordIdColumn: ReadonlyArray<Record.RecordElement>, annealNodeToStratumNodeMap: WeakMap<AnnealNode.Node, AnnealStratumNode>, node: AnnealNode.Node): AnnealNode.Node {
    // Output full records for leaf nodes
    if (node.type === "stratum-records") {
        const stratumNode = annealNodeToStratumNodeMap.get(node);

        if (stratumNode === undefined) {
            throw new Error(`Could not find stratum node for anneal node ${node._id}`);
        }

        const recordPointers = Array.from(stratumNode.getRecordPointers());

        const outputNode: AnnealNode.NodeStratumWithRecordChildren = {
            _id: node._id,
            type: node.type,
            stratum: node.stratum,
            recordIds: recordPointers.map(pointer => recordIdColumn[pointer]),
        };

        return outputNode;
    }

    // Map stratum-stratum nodes
    if (node.type === "stratum-stratum") {
        const outputNode: AnnealNode.NodeStratumWithStratumChildren = {
            _id: node._id,
            type: node.type,
            stratum: node.stratum,
            children: node.children.map(childNode => generateTree(recordIdColumn, annealNodeToStratumNodeMap, childNode) as AnnealNode.NodeStratumWithStratumChildren | AnnealNode.NodeStratumWithRecordChildren),
        };

        return outputNode;
    }

    // Map root nodes
    if (node.type === "root") {
        const outputNode: AnnealNode.NodeRoot = {
            _id: node._id,
            type: node.type,
            partitionValue: node.partitionValue,
            children: node.children.map(childNode => generateTree(recordIdColumn, annealNodeToStratumNodeMap, childNode) as AnnealNode.NodeStratumWithStratumChildren),
        };

        return outputNode;
    }

    throw new Error("Unknown node type");
}
/**
 * Calculates size of anneal nodes given, inclusive of child nodes, and sets
 * this information into supplied size map WeakMap object.
 * 
 * @param sizeMap Map of anneal node to number (size)
 * @param node Node to calculate size on
 */
export function fillSizeMap(sizeMap: WeakMap<AnnealNode.Node, number>, node: AnnealNode.Node) {
    // Wrapper to prevent the number that is returned at each recursive call
    // from being returned to the external caller
    //
    // NOTE: Returned number is only for internal use for the Array#reduce calls
    (function _fillSizeMap(node: AnnealNode.Node): number {
        // For the leaf nodes with records attached to them, return the number of records
        if (node.type === "stratum-records") {
            const size = node.recordIds.length;
            sizeMap.set(node, size);

            // NOTE: Even though we have side effects and we normally 
            return size;
        }

        // For general nodes with children, sum up the sizes of all children
        const children = node.children;
        const totalSize = children.reduce((carry, child) => carry + _fillSizeMap(child), 0);
        sizeMap.set(node, totalSize);

        return totalSize;
    })(node);
}

export function generateNodeSizeMap(rootNode: AnnealNode.NodeRoot) {
    // Maps node to a number which represents the total number of records that
    // sit under it
    const nodeSizeMap = new WeakMap<AnnealNode.Node, number>();

    // Run through all nodes to calculate their sizes; set sizes into size map
    fillSizeMap(nodeSizeMap, rootNode);

    return nodeSizeMap;
}
