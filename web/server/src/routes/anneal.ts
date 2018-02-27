import * as express from "express";

import * as ToServerAnnealRequest from "../../../common/ToServerAnnealRequest";
// import * as IPCData from "../data/IPCData";
import * as IPCQueue from "../data/IPCQueue";
// import * as PendingResponseStore from "../data/PendingResponseStore";
import * as HTTPResponseCode from "../core/HTTPResponseCode";
import * as RecordDataCheckValidity from "../middleware/RecordDataCheckValidity";
import * as ConstraintCheckValidity from "../middleware/ConstraintCheckValidity";
import * as RedisService from "../utils/RedisService";
import AnnealStatus from "../../../common/AnnealStatus";

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

    router.route("/annealResults")
        .post(
            annealResults
        )

    return router;
};


const anneal: express.RequestHandler =
    (req, res) => {
        const annealRequest: ToServerAnnealRequest.Root = req.body;

        // 1. Generate UUID associated with request
        // const redisResponseId = RedisService.createNewEntry();
        const redisResponseId = RedisService.generateUID();
        // Add request to store

        // 3. Replace this with new redis client interface
        // const serverResponseId = PendingResponseStore.add(res);
        // console.log(`Anneal request to server worker received; response tagged with ID ${serverResponseId}`);
        console.log(`Anneal request to server worker received; response tagged with ID ${redisResponseId}`);


        // const annealJobData: IPCData.AnnealRequestMessageData = {
        //     _meta: {
        //         // 4. Replace this with redis uuid
        //         serverResponseId,
        //     },

        //     annealRequest,
        // }

        const annealJobData: any = {
            _meta: {
                // 4. Replace this with redis uuid
                redisResponseId,
            },

            annealRequest,
        }


        // Queue request data now to reduce server blocking
        IPCQueue.queueMessage("anneal-request", annealJobData);

        // There is no response yet; the anneal job has been sent and will be
        // responded to by the "anneal-response" message handler that's also run
        // in the main server process

        //The above is being changed to sending the response to the client right away with the UID
        res
            .status(HTTPResponseCode.SUCCESS.ACCEPTED)
            .json({ id: redisResponseId })
    };

const annealResults: express.RequestHandler =
    async (req, res) => {
        try {
            const annealRequest = req.body;
            const annealID = annealRequest.id;
            // const results = await RedisService.getLRANGE(annealID, 0, 0);
            const annealMapList = await RedisService.getLRANGE(annealID, 0, -1);
            const statusTimestampPartitionMap = {} as any;
            let resultsObject: any = undefined;

            for(let annealMap of annealMapList) {
                const annealStatusObject = JSON.parse(annealMap);
                if(annealStatusObject.status === AnnealStatus.ANNEAL_COMPLETE) {
                    resultsObject = annealStatusObject;
                    break;
                }
                if (statusTimestampPartitionMap[annealStatusObject.annealNode.partitionValue] === undefined) {
                    statusTimestampPartitionMap[annealStatusObject.annealNode.partitionValue] = {
                        annealStatusObject: annealStatusObject
                    }
                } else {
                    if(annealStatusObject.timestamp > statusTimestampPartitionMap[annealStatusObject.annealNode.partitionValue].annealStatusObject.timestamp) {
                        statusTimestampPartitionMap[annealStatusObject.annealNode.partitionValue] = {
                            annealStatusObject: annealStatusObject
                        }
                    }
                }
            }
            
           
            
            if (resultsObject === undefined) {
                res
                    .json({statusMap: statusTimestampPartitionMap});
            } else {
                res
                    .status(HTTPResponseCode.SUCCESS.OK)
                    .json(resultsObject)

            }


        } catch (e) {
            console.log('Error:' + e);
            res
                .status(HTTPResponseCode.SERVER_ERROR.INTERNAL_SERVER_ERROR)
                .json({ status: AnnealStatus.ANNEAL_FAILED, error: e });
        }
    }