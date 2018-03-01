import * as express from "express";

import * as ToServerAnnealRequest from "../../../common/ToServerAnnealRequest";
import * as IPCData from "../data/IPCData";
import * as IPCQueue from "../data/IPCQueue";
import * as HTTPResponseCode from "../core/HTTPResponseCode";
import * as RecordDataCheckValidity from "../middleware/RecordDataCheckValidity";
import * as ConstraintCheckValidity from "../middleware/ConstraintCheckValidity";
import * as RedisService from "../utils/RedisService";
import { AnnealStatusState, StatusMap } from "../../../common/AnnealState";

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

            const annealStateObjects = annealMapList.map((jsonString: string) => JSON.parse(jsonString));
            let partitionStateStatusMap: StatusMap = {};

            // Filter status type states (i.e. exclude anneal result states)
            const statusStateObjects: AnnealStatusState[] = annealStateObjects.filter((o: any) => o.results === undefined);

            statusStateObjects.forEach((statusStateObject) => {
                // Get partition identifier
                const partitionKey = statusStateObject.annealNode.partitionValue;

                // Check if key is defined in partition state status map
                if (partitionStateStatusMap[partitionKey] === undefined) {
                    partitionStateStatusMap[partitionKey] = statusStateObject;
                } else {
                    // Key already exists
                    const oldStatusStateObject = partitionStateStatusMap[partitionKey];

                    if (statusStateObject.timestamp > oldStatusStateObject.timestamp) {
                        // Update key with new status state object
                        partitionStateStatusMap[partitionKey] = statusStateObject;
                    }
                }

            });

            const expectedNumberOfResults = await RedisService.getExpectedNumberOfAnnealResults(annealID);

            res
                .status(HTTPResponseCode.SUCCESS.OK)
                .json({ statusMap: partitionStateStatusMap, expectedNumberOfResults: expectedNumberOfResults });



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
                    // Set expiry time for all anneal data pertaining to the anneal job (already returned to user)
                    RedisService.expireAnnealData(annealID, 60);
                }
            }

        } catch (e) {
            res
                .status(HTTPResponseCode.SERVER_ERROR.INTERNAL_SERVER_ERROR)
                .send({ Error: e });
            throw new Error(e);

        }

    }