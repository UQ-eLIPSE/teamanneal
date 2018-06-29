import * as IPCData from "../data/IPCData";
import * as IPCQueue from "../data/IPCQueue";

import * as Record from "../../../common/Record";
import * as AnnealNode from "../../../common/AnnealNode";
import { SwapRecordsTestPermutationOperationResult } from "../../../common/ToClientSatisfactionTestPermutationResponse";

import { calculateTotalSatisfactionFromAnnealRequest } from "../anneal/ConstraintSatisfaction";
import { setRecordIdArray, swapRecords } from "../anneal/AnnealNodeTreeEditOperation";
import { generateAllLeafNodeMap } from "../data/AnnealNode";

export function init(workerId: string) {
    IPCQueue.openQueue()
        .process("test-permutation-swap-records", 1, async (job, done) => {
            const data: IPCData.TestPermutationSwapRecordsJobData = job.data;
            const { _meta, strata, constraints, recordData, annealNodes, operation } = data;

            // Start processing job
            const tag = `[${_meta.annealNode.index} of ID = ${_meta.redisResponseId}]`;

            console.log(`Anneal worker ${workerId} - Testing permutations (swap records) for ${tag}...`);

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

            // Get the record we're swap around
            const nodeAId = operation.nodeA;
            const nodeARecordId = operation.recordIdA;

            const nodeA = leafNodes.get(nodeAId);

            if (nodeA === undefined) {
                throw new Error(`Node with ID "${nodeAId}" not found`);
            }

            if (nodeA.recordIds.indexOf(nodeARecordId) < 0) {
                throw new Error(`Record ID "${nodeARecordId}" not found in node ${nodeA._id}`);
            }

            // Output array
            const output: SwapRecordsTestPermutationOperationResult = [];

            // Swap record operation permutation loop
            leafNodes.forEach((nodeB) => {
                // Copy record ID array since we will be modifying the array 
                // during this loop
                [...nodeB.recordIds].forEach((recordIdB) => {
                    // 1. Perform swap operation
                    swapRecords(nodeA, nodeARecordId, nodeB, recordIdB);

                    // 2. Calculate satisfaction value
                    // Note that we don't need to change the root node reference as 
                    // we're doing the modifications in place
                    const satisfaction = calculateTotalSatisfactionFromAnnealRequest(annealRootNode, recordData, strata, constraints);

                    // 3. Save satisfation value to output array
                    output.push({
                        nodeB: nodeB._id,
                        recordIdB,
                        satisfaction,
                    });

                    // 4. Restore mutated arrays from original copy
                    //
                    // Note that we must copy otherwise we still hold references to
                    // the array from `leafNodeOriginalArrays` on the n+1th round
                    // of the loop
                    setRecordIdArray(nodeA, [...leafNodeOriginalArrays.get(nodeA)!]);
                    setRecordIdArray(nodeB, [...leafNodeOriginalArrays.get(nodeB)!]);
                });
            });

            done(undefined, output);
        });
}
