import * as ToServerAnnealRequest from "../../../common/ToServerAnnealRequest";
import * as HTTPResponseCode from "../core/HTTPResponseCode";

import * as express from "express";
import * as SourceData from "../anneal/SourceData";

// Signature of exported function must not be altered for all routers
module.exports = () => {
    const router = express.Router();

    router.route("/")
        .post(PostDataAnnealHandler);

    return router;
};

const PostDataAnnealHandler: express.RequestHandler =
    (req, res, _next) => {
        const data: ToServerAnnealRequest.Root = req.body;

        // Check that we only have one and only one ID column
        if (!SourceData.checkColumnsOnlyOneId(data.sourceData.columns)) {
            return res
                .status(HTTPResponseCode.CLIENT_ERROR.BAD_REQUEST)
                .json({
                    message: "There must be one and only one column tagged as an identifier"
                });
        }

        // Convert source data to one with partitioned records
        const sourceData = SourceData.convertToPartitionedRecordArrayDesc(data.sourceData);

        return res
            .status(HTTPResponseCode.SUCCESS.OK)
            .json({
                numberOfPartitions: sourceData.records.length,
                numberOfRecords: sourceData.records.reduce((c, arr) => c + arr.length, 0),
            });
    };
