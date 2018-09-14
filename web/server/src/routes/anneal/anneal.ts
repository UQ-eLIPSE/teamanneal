import express from "express";

import * as ToServerAnnealRequest from "../../../../common/ToServerAnnealRequest";
import { AnnealStatusState, StatusMap } from "../../../../common/AnnealState";

import * as IPCData from "../../data/IPCData";
import * as IPCQueue from "../../data/IPCQueue";
import * as PendingResultCollationStore from "../../data/PendingResultCollationStore";

import * as HTTPResponseCode from "../../core/HTTPResponseCode";

import * as RedisService from "../../utils/RedisService";

/**
 * Endpoint for user to initialise an anneal job
 */
export const runAnneal: express.RequestHandler =
    async (req, res, _next) => {
        const annealRequest: ToServerAnnealRequest.Root = req.body;

        // Generate UUID associated with anneal request
        const redisResponseId = RedisService.generateUUIDv4();

        console.log(`Anneal request to server worker received; response tagged with ID ${redisResponseId}`);

        // Start splitting job
        console.log(`Anneal request [${redisResponseId}] - Starting...`);

        const { strata, constraints, recordData, annealNodes } = annealRequest;
        const numberOfNodes = annealNodes.length;

        // Create entry in result collation store
        PendingResultCollationStore.add(redisResponseId, numberOfNodes);

        // Set expected number of results for anneal in Redis
        storeExpectedNumberOfResults(redisResponseId, numberOfNodes);

        // Split job, one per anneal node in the request
        annealNodes.forEach((annealNode, i) => {
            console.log(`Anneal request [${redisResponseId}] - Splitting job: ${i + 1}/${numberOfNodes}`);

            const annealJobMessage: IPCData.AnnealJobData = {
                _meta: {
                    redisResponseId,
                    annealNode: {
                        id: annealNode._id,
                        index: i,
                    },
                },

                annealNode,
                constraints,
                recordData,
                strata,
            };

            IPCQueue.queueMessage("anneal", annealJobMessage);
        });

        // Send response with anneal job's ID (stored in Redis) 
        res
            .status(HTTPResponseCode.SUCCESS.ACCEPTED)
            .json({ id: redisResponseId });

    };

/**
 * Endpoint for client to query for anneal status
 */
export const getAnnealStatus: express.RequestHandler =
    async (req, res, _next) => {
        try {
            if (req.query.id === undefined) {
                throw new Error("Anneal job ID is invalid");
            }

            const annealID = req.query.id;
            const annealMapList = await RedisService.getLRANGE(annealID, 0, -1);

            const annealStateObjects = annealMapList.map((jsonString: string) => JSON.parse(jsonString));
            const partitionStateStatusMap: StatusMap = {};

            // Filter status type states (i.e. exclude anneal result states)
            const statusStateObjects: AnnealStatusState[] = annealStateObjects.filter((o: any) => o.results === undefined);

            statusStateObjects.forEach((statusStateObject) => {
                // Get partition identifier
                const partitionKey = statusStateObject.annealNode.partitionValue;

                // Makes responses lightweight, client doesn't need "annealNode" for anneal status responses
                const { annealNode, ...statusStateResponseObject } = statusStateObject;

                // Check if key is defined in partition state status map
                if (partitionStateStatusMap[partitionKey] === undefined) {
                    partitionStateStatusMap[partitionKey] = statusStateResponseObject;
                } else {
                    // Key already exists
                    const oldStatusStateObject = partitionStateStatusMap[partitionKey];

                    if (statusStateObject.timestamp > oldStatusStateObject.timestamp) {
                        // Update key with new status state object
                        partitionStateStatusMap[partitionKey] = statusStateResponseObject;
                    }
                }

            });

            const expectedNumberOfResults = await RedisService.getExpectedNumberOfAnnealResults(annealID);

            res
                .status(HTTPResponseCode.SUCCESS.OK)
                .json({
                    statusMap: partitionStateStatusMap,
                    expectedNumberOfResults,
                });

        } catch (e) {
            console.error(e);

            res
                .status(HTTPResponseCode.SERVER_ERROR.INTERNAL_SERVER_ERROR)
                .json({ error: e });
        }

    }

/**
 * Endpoint for client to retrieve results once the anneal is complete
 */
export const getAnnealResult: express.RequestHandler =
    async (req, res, _next) => {
        try {
            if (req.query.id === undefined) {
                throw new Error("Anneal job ID is invalid");
            }

            const annealID = req.query.id;

            // Go through entire list of anneal status objects to find the 
            // final results object (the one that contains the `results` prop)
            const annealMapList: ReadonlyArray<string> = await RedisService.getLRANGE(annealID, 0, -1);

            for (let annealMap of annealMapList) {
                // If the JSON object of the string has the `results` property
                // then we say that it is the final combined result to send to
                // the client
                if (JSON.parse(annealMap).results) {
                    // Send response
                    //
                    // Note that we set the content type here to JSON because
                    // the `annealMap` result is actually a string internally
                    // and there is no need to parse and serialise the JSON 
                    // again purely for delivery to the client
                    res
                        .type("json")
                        .status(HTTPResponseCode.SUCCESS.OK)
                        .send(annealMap);

                    // Set expiry time for all anneal data pertaining to the 
                    // anneal job (already returned to user) to no later than 
                    // 60 seconds
                    RedisService.expireAnnealData(annealID, 60);

                    // We're done; stop going through array
                    return;
                }
            }

        } catch (e) {
            console.error(e);

            res
                .status(HTTPResponseCode.SERVER_ERROR.INTERNAL_SERVER_ERROR)
                .send({ error: e });
        }
    }

/**
 * Stores the expected number of partitions in redis as a new key
 * @param redisResponseId 
 * @param numberOfResults Expected number of results
 */
function storeExpectedNumberOfResults(redisResponseId: string, numberOfResults: number): boolean {
    return RedisService.getClient().set(RedisService.appendExpectedNumberOfAnnealResultsTag(redisResponseId), numberOfResults + '');
}
