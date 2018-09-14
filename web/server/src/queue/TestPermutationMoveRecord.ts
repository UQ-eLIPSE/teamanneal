import * as IPCData from "../data/IPCData";
import * as IPCQueue from "../data/IPCQueue";

import * as Record from "../../../common/Record";
import * as AnnealNode from "../../../common/AnnealNode";
import { MoveRecordTestPermutationOperationResult } from "../../../common/ToClientSatisfactionTestPermutationResponse";

import { calculateTotalSatisfactionFromAnnealRequest } from "../anneal/ConstraintSatisfaction";
import { moveRecord, setRecordIdArray } from "../anneal/AnnealNodeTreeEditOperation";
import { generateAllLeafNodeMap } from "../data/AnnealNode";

export function init() {
    IPCQueue.openQueue()
        .process("test-permutation-move-record", 1, async (job, done) => {
            const data: IPCData.TestPermutationMoveRecordJobData = job.data;
            const { strata, constraints, recordData, annealNodes, operation } = data;

            // Start processing job
            console.log(`Testing permutations (move record)...`);

            // NOTE: We only support one root node for now
            // TODO: Support multiple root nodes for cross-partition moves
            const annealRootNode = annealNodes[0];

            if (annealRootNode === undefined) {
                throw new Error("No root node defined");
            }

            // Get all leaf nodes
            const leafNodes = generateAllLeafNodeMap(annealRootNode);

            // Copy leaf node record arrays
            const leafNodeOriginalArrays = new WeakMap<AnnealNode.NodeStratumWithRecordChildren, ReadonlyArray<Record.RecordElement>>();
            leafNodes.forEach((node) => {
                leafNodeOriginalArrays.set(node, [...node.recordIds]);
            });

            // Get the record we're moving around
            const fromNodeId = operation.fromNode;
            const fromNodeRecordId = operation.recordId;

            const fromNode = leafNodes.get(fromNodeId);

            if (fromNode === undefined) {
                throw new Error(`Node with ID "${fromNodeId}" not found`);
            }

            if (fromNode.recordIds.indexOf(fromNodeRecordId) < 0) {
                throw new Error(`Record ID "${fromNodeRecordId}" not found in node ${fromNode._id}`);
            }

            // Output array
            const output: MoveRecordTestPermutationOperationResult = [];

            // Move record operation permutation loop
            leafNodes.forEach((toNode) => {
                // 1. Perform move operation
                moveRecord(fromNode, fromNodeRecordId, toNode);

                // 2. Calculate satisfaction value
                // Note that we don't need to change the root node reference as 
                // we're doing the modifications in place
                const satisfaction = calculateTotalSatisfactionFromAnnealRequest(annealRootNode, recordData, strata, constraints);

                // 3. Save satisfation value to output array
                output.push({
                    toNode: toNode._id,
                    satisfaction,
                });

                // 4. Restore mutated arrays from original copy
                //
                // Note that we must copy otherwise we still hold references to
                // the array from `leafNodeOriginalArrays` on the n+1th round
                // of the loop
                setRecordIdArray(fromNode, [...leafNodeOriginalArrays.get(fromNode)!]);
                setRecordIdArray(toNode, [...leafNodeOriginalArrays.get(toNode)!]);
            });

            done(undefined, output);

            console.log(`Finished testing permutations (move record)`);
        });
}
