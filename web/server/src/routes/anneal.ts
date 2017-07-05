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
    (req, res, _next) => {
        const annealRequest: ToServerAnnealRequest.Root = req.body;

        // Add request to store
        const serverResponseId = PendingResponseStore.add(res);
        console.log(`Anneal response tagged with ID ${serverResponseId}`);

        const annealJobData: IPCData.AnnealJobData = {
            annealRequest,
            serverResponseId,
        }

        // Queue job
        IPCQueue.queue
            .create("anneal", annealJobData)
            .removeOnComplete(true)
            .save();

        // There is no response yet; the anneal job has been sent and will be
        // responded to by the "anneal-result" message handler
    };
