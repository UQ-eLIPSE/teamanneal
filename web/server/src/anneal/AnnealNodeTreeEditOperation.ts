import * as Record from "../../../common/Record";
import * as AnnealNode from "../../../common/AnnealNode";

// As part of the edit operations, we directly work on the tree; this does mean
// that our original interfaces will need to be mutable.
//
// The mutable types are here instead of the original interfaces because this
// behaviour is very specific to edits only.

type Mutable<T> =
    // `ReadonlyArray`s are converted to normal arrays
    T extends ReadonlyArray<infer U> ? Array<U> :
    // Object properties are converted to non-`readonly` properties
    T extends object ? { -readonly [P in keyof T]: Mutable<T[P]> } :
    T;

type NodeWithRecords = AnnealNode.NodeStratumWithRecordChildren;
type MutableNodeWithRecords = Mutable<NodeWithRecords>;

/**
 * Deletes record ID from given node.
 * 
 * @param node 
 * @param recordId 
 */
export function deleteRecord(node: NodeWithRecords, recordId: Record.RecordElement) {
    const index = node.recordIds.indexOf(recordId);

    if (index < 0) {
        throw new Error("Record ID not found");
    }

    (node as MutableNodeWithRecords).recordIds.splice(index, 1);

    // Do not return value; side effects present
}

/**
 * Inserts a record ID into the given node.
 * 
 * @param node 
 * @param recordId 
 */
export function insertRecord(node: NodeWithRecords, recordId: Record.RecordElement) {
    (node as MutableNodeWithRecords).recordIds.push(recordId);

    // Do not return value; side effects present
}

/**
 * Sets the record ID value at the given index inside the `recordIds` property
 * of the node.
 * 
 * @param node 
 * @param index 
 * @param recordId 
 */
export function setRecord(node: NodeWithRecords, index: number, recordId: Record.RecordElement) {
    // Check that the index is within bounds
    if (index < 0 || index >= node.recordIds.length) {
        throw new Error("Index out of bounds");
    }

    (node as MutableNodeWithRecords).recordIds[index] = recordId;

    // Do not return value; side effects present
}

/**
 * Directly sets the record ID array to the given node.
 * 
 * @param node 
 * @param recordIds 
 */
export function setRecordIdArray(node: NodeWithRecords, recordIds: ReadonlyArray<Record.RecordElement>) {
    (node as MutableNodeWithRecords).recordIds = recordIds as Record.RecordElement[];

    // Do not return value; side effects present
}

export function moveRecord(fromNode: AnnealNode.NodeStratumWithRecordChildren, recordId: Record.RecordElement, toNode: AnnealNode.NodeStratumWithRecordChildren) {
    deleteRecord(fromNode, recordId);

    insertRecord(toNode, recordId);

    // Do not return value; side effects present
}

export function swapRecords(nodeA: NodeWithRecords, recordIdA: Record.RecordElement, nodeB: NodeWithRecords, recordIdB: Record.RecordElement) {
    const indexA = nodeA.recordIds.indexOf(recordIdA);
    const indexB = nodeB.recordIds.indexOf(recordIdB);

    if (indexA < 0 || indexB < 0) {
        throw new Error("Record IDs not found in given nodes");
    }

    setRecord(nodeA, indexA, recordIdB);
    setRecord(nodeB, indexB, recordIdA);

    // Do not return value; side effects present
}
