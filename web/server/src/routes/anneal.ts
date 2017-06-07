import * as ToServerAnnealRequest from "../../../common/ToServerAnnealRequest";
import * as HTTPResponseCode from "../core/HTTPResponseCode";

import * as express from "express";

// Middleware
import * as SourceDataCheckValidity from "../middleware/SourceDataCheckValidity";
import * as ConstraintCheckValidity from "../middleware/ConstraintCheckValidity";

// Data manipulation and structures
import * as SourceData from "../data/SourceData";

// Anneal-related
import * as Anneal from "../anneal/Anneal";

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
        const data: ToServerAnnealRequest.Root = req.body;

        // Convert sourceData description to that which uses partitioned record
        // arrays, if records are not already partitioned
        const sourceData = SourceData.convertToPartitionedRecordArrayDesc(data.sourceData)

        // Run anneal
        const output = Anneal.anneal(sourceData, data.strata, data.constraints);

        return res
            .status(HTTPResponseCode.SUCCESS.OK)
            .json({
                output,
            });
    };
