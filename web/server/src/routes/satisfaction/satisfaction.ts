import express from "express";

import * as ToServerAnnealRequest from "../../../../common/ToServerAnnealRequest";
import { MoveRecordSatisfactionTestPermutationRequest, SwapRecordsSatisfactionTestPermutationRequest } from "../../../../common/ToServerSatisfactionTestPermutationRequest";
import { MoveRecordTestPermutationOperationResult, SwapRecordsTestPermutationOperationResult } from "../../../../common/ToClientSatisfactionTestPermutationResponse";
import { SatisfactionMap } from "../../../../common/ConstraintSatisfaction";

import * as HTTPResponseCode from "../../core/HTTPResponseCode";

import * as IPCData from "../../data/IPCData";
import * as IPCQueue from "../../data/IPCQueue";

/**
 * Endpoint that ingests a node tree (like that of a normal anneal request) but
 * only returns the satisfaction values of that tree.
 */
export const calculateSatisfaction: express.RequestHandler =
    async (req, res, _next) => {
        try {
            const data: ToServerAnnealRequest.Root = req.body;
            const { strata, constraints, recordData, annealNodes } = data;

            const jobMessage: IPCData.SatisfactionCalculationJobData = {
                annealNodes,
                constraints,
                recordData,
                strata,
            };

            const job = IPCQueue.queueMessage("satisfaction-calculation", jobMessage);

            // Map out the satisfaction objects per root node (partition)
            const satisfactionObjects =
                await new Promise<SatisfactionMap[]>((resolve, reject) => {
                    job.on("complete", res => resolve(res));
                    job.on("failed", err => reject(err));
                });

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
        try {
            const data: MoveRecordSatisfactionTestPermutationRequest = req.body;
            const { strata, constraints, recordData, annealNodes, operation } = data;

            const jobMessage: IPCData.TestPermutationMoveRecordJobData = {
                annealNodes,
                constraints,
                recordData,
                strata,
                operation,
            };

            const job = IPCQueue.queueMessage("test-permutation-move-record", jobMessage);

            const output =
                await new Promise<MoveRecordTestPermutationOperationResult[]>((resolve, reject) => {
                    job.on("complete", res => resolve(res));
                    job.on("failed", err => reject(err));
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
        try {
            const data: SwapRecordsSatisfactionTestPermutationRequest = req.body;
            const { strata, constraints, recordData, annealNodes, operation } = data;

            const jobMessage: IPCData.TestPermutationSwapRecordsJobData = {
                annealNodes,
                constraints,
                recordData,
                strata,
                operation,
            };

            const job = IPCQueue.queueMessage("test-permutation-swap-records", jobMessage);

            const output =
                await new Promise<SwapRecordsTestPermutationOperationResult[]>((resolve, reject) => {
                    job.on("complete", res => resolve(res));
                    job.on("failed", err => reject(err));
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
