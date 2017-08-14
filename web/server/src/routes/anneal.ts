import * as express from "express";

import * as ToServerAnnealRequest from "../../../common/ToServerAnnealRequest";
import * as IPCData from "../data/IPCData";
import * as IPCQueue from "../data/IPCQueue";
import * as PendingResponseStore from "../data/PendingResponseStore";

import * as SourceDataCheckValidity from "../middleware/SourceDataCheckValidity";
import * as ConstraintCheckValidity from "../middleware/ConstraintCheckValidity";

// Signature of exported function must not be altered for all routers
module.exports = () => {
    const router = express.Router();

    router.route("/")
        .post(
        // Validation middleware
        // TODO: More input validation
        SourceDataCheckValidity.generate(req => req.body.sourceData),
        ConstraintCheckValidity.generate(req => req.body.constraints),

        // Run anneal
        anneal
        );

    return router;
};



const anneal: express.RequestHandler =
    (req, res) => {
        const annealRequest: ToServerAnnealRequest.Root = req.body;

        // Add request to store
        const serverResponseId = PendingResponseStore.add(res);
        console.log(`Anneal request to server worker received; response tagged with ID ${serverResponseId}`);

        const annealJobData: IPCData.AnnealRequestMessageData = {
            _meta: {
                serverResponseId,
            },

            annealRequest,
        }

        // Queue request data now to reduce server blocking
        IPCQueue.queueMessage("anneal-request", annealJobData);

        // There is no response yet; the anneal job has been sent and will be
        // responded to by the "anneal-response" message handler that's also run
        // in the main server process
    };
