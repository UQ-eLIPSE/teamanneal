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

/**
 * Extracts records which actually sit under the given root node, from a larger 
 * set of records.
 * 
 * @param rootNode Root node
 * @param idColumnIndex Index of the ID column in each record row
 * @param records Set of records
 */
export function filterRecords(rootNode: AnnealNode.NodeRoot, idColumnIndex: number, records: Record.RecordSet) {
    // Get records which have an ID that is specified in some node's set of 
    // record children
    const idValues = extractRecordIds(rootNode);

    // Retrieve only records that are contained in this anneal node
    const filteredRecords = records.filter((record) => {
        const idValue = record[idColumnIndex];
        return idValues.indexOf(idValue) > -1;
    });

    // Also check that record IDs have not been used twice or that records were
    // not found
    if (filteredRecords.length !== idValues.length) {
        throw new Error("Duplicate or invalid record ID references under anneal node");
    }

    return filteredRecords;
}

/**
 * Extracts all record IDs that sit under given root node.
 * 
 * Function does not check for non-uniqueness, and thus may contain duplicate 
 * record IDs if the nodes don't uniquely specify IDs.
 * 
 * @param node
 */
export function extractRecordIds(node: AnnealNode.Node, accumulator: Record.RecordElement[] = []) {
    switch (node.type) {
        case "root":
        case "stratum-stratum": {
            node.children.forEach(child => extractRecordIds(child, accumulator));
            return accumulator;
        }

        case "stratum-records": {
            accumulator.push(...node.recordIds);
            return accumulator;
        }
    }
}

/**
 * Finds the leaf node with the given record ID where present under the given 
 * node.
 * 
 * @param node 
 * @param recordId 
 */
export function findLeafNodeWithRecordId(node: AnnealNode.Node, recordId: Record.RecordElement): AnnealNode.NodeStratumWithRecordChildren | undefined {
    switch (node.type) {
        case "root":
        case "stratum-stratum": {
            for (let child of node.children) {
                const leafNode = findLeafNodeWithRecordId(child, recordId);

                if (leafNode !== undefined) {
                    return leafNode;
                }
            }

            return undefined;
        }

        case "stratum-records": {
            if (node.recordIds.indexOf(recordId) >= 0) {
                return node;
            }

            return undefined;
        }
    }
}

export function getAllLeafNodes(node: AnnealNode.Node, accumulator: AnnealNode.NodeStratumWithRecordChildren[] = []) {
    switch (node.type) {
        case "root":
        case "stratum-stratum": {
            node.children.forEach(child => getAllLeafNodes(child, accumulator));
            return accumulator;
        }

        case "stratum-records": {
            accumulator.push(node);
            return accumulator;
        }
    }
}

export function generateAllLeafNodeMap(node: AnnealNode.Node, map: Map<string, AnnealNode.NodeStratumWithRecordChildren> = new Map()) {
    switch (node.type) {
        case "root":
        case "stratum-stratum": {
            node.children.forEach(child => generateAllLeafNodeMap(child, map));
            return map;
        }

        case "stratum-records": {
            map.set(node._id, node);
            return map;
        }
    }
}
