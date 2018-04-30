import * as express from "express";

import * as Record from "../../../../common/Record";
import * as AnnealNode from "../../../../common/AnnealNode";
import * as ToServerAnnealRequest from "../../../../common/ToServerAnnealRequest";

import * as HTTPResponseCode from "../../core/HTTPResponseCode";
import { generateSatisfactionMapFromAnnealRequest, calculateTotalSatisfactionFromAnnealRequest } from "../../anneal/ConstraintSatisfaction";
import { moveRecord, setRecordIdArray } from "../../anneal/AnnealNodeTreeEditOperation";
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
                throw new Error(`Record ID "${operation.recordId}" not found in node ${fromNode._id}`);
            }

            // Output array
            // TODO: Formalise the type of the object and share with client
            const output: { toNode: string, satisfaction: ReturnType<typeof calculateTotalSatisfactionFromAnnealRequest> }[] = [];

            // Move record operation permutation loop
            leafNodes.forEach((node) => {
                // 1. Perform move operation
                moveRecord(fromNode, fromNodeRecordId, node);

                // 2. Calculate satisfaction value
                // Note that we don't need to change the root node reference as 
                // we're doing the modifications in place
                const satisfaction = calculateTotalSatisfactionFromAnnealRequest(annealRootNode, recordData, strata, constraints);

                // 3. Save satisfation value to output array
                output.push({
                    toNode: node._id,
                    satisfaction,
                })

                // 4. Restore mutated arrays from original copy
                setRecordIdArray(fromNode, leafNodeOriginalArrays.get(fromNode)!);
                setRecordIdArray(node, leafNodeOriginalArrays.get(node)!);
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
