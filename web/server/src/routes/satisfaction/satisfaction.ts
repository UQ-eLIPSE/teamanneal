import * as express from "express";

import * as Record from "../../../../common/Record";
import * as AnnealNode from "../../../../common/AnnealNode";
import * as ToServerAnnealRequest from "../../../../common/ToServerAnnealRequest";

import * as HTTPResponseCode from "../../core/HTTPResponseCode";
import { generateSatisfactionMapFromAnnealRequest, calculateTotalSatisfactionFromAnnealRequest } from "../../anneal/ConstraintSatisfaction";
import { moveRecord, setRecordIdArray, swapRecords } from "../../anneal/AnnealNodeTreeEditOperation";
import { generateAllLeafNodeMap } from "../../data/AnnealNode";

/**
 * Endpoint that ingests a node tree (like that of a normal anneal request) but
 * only returns the satisfaction values of that tree.
 */
export const calculateSatisfaction: express.RequestHandler =
    async (req, res, _next) => {
        // TODO: Split satisfaction calculation into a queue

        try {
            const annealRequest: ToServerAnnealRequest.Root = req.body;
            const { strata, constraints, recordData, annealNodes } = annealRequest;

            // Map out the satisfaction objects per node
            const satisfactionObjects =
                annealNodes.map(annealNode => generateSatisfactionMapFromAnnealRequest(annealNode, recordData, strata, constraints));

            return res
                .status(HTTPResponseCode.SUCCESS.OK)
                .json(satisfactionObjects);

        } catch (error) {
            console.error(error);

            return res
                .status(HTTPResponseCode.SERVER_ERROR.INTERNAL_SERVER_ERROR)
                .json({ error });
        }
    };

/**
 * Endpoint that tests a move of a given target record against all possible 
 * locations under the root node
 */
export const testPermutationsMoveRecord: express.RequestHandler =
    async (req, res, _next) => {
        // TODO: Split satisfaction calculation into a queue

        try {
            // TODO: Formalise the type for the operation extension
            const annealRequest: ToServerAnnealRequest.Root & { operation: { fromNode: string, recordId: Record.RecordElement } } = req.body;
            const { strata, constraints, recordData, annealNodes, operation } = annealRequest;

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
            // TODO: Formalise the type of the object and share with client
            const output: { toNode: string, satisfaction: ReturnType<typeof calculateTotalSatisfactionFromAnnealRequest> }[] = [];

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
                })

                // 4. Restore mutated arrays from original copy
                //
                // Note that we must copy otherwise we still hold references to
                // the array from `leafNodeOriginalArrays` on the n+1th round
                // of the loop
                setRecordIdArray(fromNode, [...leafNodeOriginalArrays.get(fromNode)!]);
                setRecordIdArray(toNode, [...leafNodeOriginalArrays.get(toNode)!]);
            });

            return res
                .status(HTTPResponseCode.SUCCESS.OK)
                .json(output);

        } catch (error) {
            console.error(error);

            return res
                .status(HTTPResponseCode.SERVER_ERROR.INTERNAL_SERVER_ERROR)
                .json({ error });
        }
    };

/**
 * Endpoint that tests a swap of a given target record against all possible 
 * locations under the root node
 */
export const testPermutationsSwapRecord: express.RequestHandler =
    async (req, res, _next) => {
        // TODO: Split satisfaction calculation into a queue

        try {
            // TODO: Formalise the type for the operation extension
            const annealRequest: ToServerAnnealRequest.Root & { operation: { nodeA: string, recordIdA: Record.RecordElement } } = req.body;
            const { strata, constraints, recordData, annealNodes, operation } = annealRequest;

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
            // TODO: Formalise the type of the object and share with client
            const output: { nodeB: string, recordIdB: Record.RecordElement, satisfaction: ReturnType<typeof calculateTotalSatisfactionFromAnnealRequest> }[] = [];

            // Swap record operation permutation loop
            leafNodes.forEach((nodeB) => {
                nodeB.recordIds.forEach((recordIdB) => {
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
                    })

                    // 4. Restore mutated arrays from original copy
                    //
                    // Note that we must copy otherwise we still hold references to
                    // the array from `leafNodeOriginalArrays` on the n+1th round
                    // of the loop
                    setRecordIdArray(nodeA, [...leafNodeOriginalArrays.get(nodeA)!]);
                    setRecordIdArray(nodeB, [...leafNodeOriginalArrays.get(nodeB)!]);
                });
            });

            return res
                .status(HTTPResponseCode.SUCCESS.OK)
                .json(output);

        } catch (error) {
            console.error(error);

            return res
                .status(HTTPResponseCode.SERVER_ERROR.INTERNAL_SERVER_ERROR)
                .json({ error });
        }
    };
