import * as express from "express";

import * as ToServerAnnealRequest from "../../../common/ToServerAnnealRequest";
import * as IPCData from "../data/IPCData";
import * as IPCQueue from "../data/IPCQueue";
import * as HTTPResponseCode from "../core/HTTPResponseCode";
import * as RecordDataCheckValidity from "../middleware/RecordDataCheckValidity";
import * as ConstraintCheckValidity from "../middleware/ConstraintCheckValidity";
import * as RedisService from "../utils/RedisService";

type _ = any;

// Signature of exported function must not be altered for all routers
module.exports = () => {
    const router = express.Router();

    router.route("/")
        .post(
            // Validation middleware
            // TODO: More input validation
            RecordDataCheckValidity.generate(req => (req.body as ToServerAnnealRequest.Root).recordData),
            ConstraintCheckValidity.generate(req => (req.body as ToServerAnnealRequest.Root).constraints),

            // Run anneal
            anneal,
    );
    router.route("/annealStatus")
        .post(
            // Get anneal's status
            annealStatus
        );

    router.route("/annealResult")
        .post(
            // Retrieve anneal result
            annealResult
        );

    return router;
};

/**
 * Endpoint for user to initialise an anneal job
 * @param req Request
 * @param res Response - Returns an id (stored on redis) which identifies the anneal job
 */
const anneal: express.RequestHandler =
    (req, res) => {
        const annealRequest: ToServerAnnealRequest.Root = req.body;

        // Generate UUID associated with anneal request
        const redisResponseId = RedisService.generateUUIDv4();

        console.log(`Anneal request to server worker received; response tagged with ID ${redisResponseId}`);

        const annealJobData: IPCData.AnnealRequestMessageData = {
            _meta: {
                redisResponseId
            },

            annealRequest,
        }


        // Queue request data now to reduce server blocking
        IPCQueue.queueMessage("anneal-request", annealJobData);

        // Send response with anneal job's ID (stored in Redis) 
        res
            .status(HTTPResponseCode.SUCCESS.ACCEPTED)
            .json({ id: redisResponseId });
    };


/**
 * Endpoint for client to query for anneal status
 * @param req Request
 * @param res Response
 */
const annealStatus: express.RequestHandler =
    async (req, res) => {
        try {
            const annealRequest = req.body;
            const annealID = annealRequest.id;
            const annealMapList = await RedisService.getLRANGE(annealID, 0, -1);
            const statusTimestampPartitionMap = {} as _;
            let statusList = annealMapList.filter((annealMap: _) => JSON.parse(annealMap).results === undefined);
            for (let annealMap of statusList) {

                const annealStatusObject = JSON.parse(annealMap);
                const partitionKey = annealStatusObject.annealNode.partitionValue;

                if (statusTimestampPartitionMap[partitionKey] === undefined) {
                    statusTimestampPartitionMap[partitionKey] = {
                        annealStatusObject: annealStatusObject
                    }
                } else {
                    if (annealStatusObject.timestamp > statusTimestampPartitionMap[partitionKey].annealStatusObject.timestamp) {
                        statusTimestampPartitionMap[partitionKey] = {
                            annealStatusObject: annealStatusObject
                        }
                    }
                }
            }
            const expectedNumberOfResults = await RedisService.getValue(annealID + '-expectedNumberOfResults');
            res
                .status(HTTPResponseCode.SUCCESS.OK)
                .json({ statusMap: statusTimestampPartitionMap, expectedNumberOfResults: expectedNumberOfResults });

        } catch (e) {
            console.error(e);
            res
                .status(HTTPResponseCode.SERVER_ERROR.INTERNAL_SERVER_ERROR)
                .json({ Error: e });
        }

    }

/**
 * Endpoint for client to retrieve results once the anneal is complete
 * @param req Request
 * @param res Response
 */
const annealResult: express.RequestHandler =
    async (req, res) => {
        try {
            const annealRequest = req.body;
            const annealID = annealRequest.id;
            const annealMapList = await RedisService.getLRANGE(annealID, 0, -1);
            for (let annealMap of annealMapList) {
                if (JSON.parse(annealMap).results) {
                    res
                        .status(HTTPResponseCode.SUCCESS.OK)
                        .send(annealMap);

                    // Sent data to user
                    // Set expiration time of 60 seconds before all data related to this anneal is removed from the store
                    RedisService.getClient().expire(annealID, 60);
                }
            }

        } catch (e) {
            res
                .status(HTTPResponseCode.SERVER_ERROR.INTERNAL_SERVER_ERROR)
                .json({ Error: e });
            throw new Error(e);

        }

    }