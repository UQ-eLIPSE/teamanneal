import * as ToServerAnnealRequest from "../../../common/ToServerAnnealRequest";
import * as HTTPResponseCode from "../core/HTTPResponseCode";

import * as express from "express";
import * as kue from "kue";

// Middleware
import * as SourceDataCheckValidity from "../middleware/SourceDataCheckValidity";
import * as ConstraintCheckValidity from "../middleware/ConstraintCheckValidity";





const queue = kue.createQueue();

interface AnnealJobData {
    serverAnnealRequest: ToServerAnnealRequest.Root,
    serverResponseId: number,
}

interface AnnealResultMessageData {
    result?: any,
    error?: any,
    serverResponseId: number,
}






// Holds references to ongoing requests which have pending anneals and not yet
// responded to
const responseMap = new Map<number, express.Response>();
let responseMapId: number = 0;

const addToResponseMap = (res: express.Response) => {
    const id = responseMapId++;
    responseMap.set(id, res);
    return id;
}

const getResponseFromMap = (id: number) => {
    return responseMap.get(id);
}

const removeFromResponseMap = (id: number) => {
    return responseMap.delete(id);
}

// Process anneal result messages and pass responses back
queue.process("anneal-result", 1, (job, done) => {
    const annealResultMessageData: AnnealResultMessageData = job.data;

    const { error, result, serverResponseId } = annealResultMessageData;
    const res = getResponseFromMap(serverResponseId);

    console.log(`Anneal result received for response ID ${serverResponseId}`);

    if (res === undefined) {
        throw new Error(`No response object found for ID ${serverResponseId}`);
    }

    if (error) {
        res
            // TODO: Don't know how to identify the error just yet
            .status(HTTPResponseCode.SERVER_ERROR.INTERNAL_SERVER_ERROR)
            .json({
                error,
            });
    } else {
        res
            .status(HTTPResponseCode.SUCCESS.OK)
            .json({
                output: result,
            });
    }

    // Clean up response from the map
    removeFromResponseMap(serverResponseId);

    done();
});




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
        const serverAnnealRequest: ToServerAnnealRequest.Root = req.body;

        const serverResponseId = addToResponseMap(res);

        console.log(`Anneal response tagged with ID ${serverResponseId}`);

        const annealJobData: AnnealJobData = {
            serverAnnealRequest,
            serverResponseId,
        }

        // Queue job
        queue.create("anneal", annealJobData).save();

        // There is no response yet; the anneal job has been sent and will be
        // responded to by the handler for "anneal-result"
    };
