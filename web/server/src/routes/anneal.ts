import * as ToServerAnnealRequest from "../../../common/ToServerAnnealRequest";
import * as HTTPResponseCode from "../core/HTTPResponseCode";

import * as express from "express";
import * as SourceData from "../anneal/SourceData";
import * as Constraint from "../anneal/Constraint";

// Signature of exported function must not be altered for all routers
module.exports = () => {
    const router = express.Router();

    router.route("/")
        .post(PostDataAnnealHandler);

    return router;
};

const PostDataAnnealHandler: express.RequestHandler =
    (req, res, _next) => {
        /** Returns HTTP400 response (Bad request) with specified message */
        const res400 = (message: string | undefined) =>
            res.status(HTTPResponseCode.CLIENT_ERROR.BAD_REQUEST)
                .json({
                    message,
                });


        const data: ToServerAnnealRequest.Root = req.body;

        // Check `sourceData`
        const sourceDataValid = SourceData.checkValidity(data.sourceData);

        if (!sourceDataValid.value) {
            return res400(sourceDataValid.message);
        }

        // Check `constraints`
        for (let i = 0; i < data.constraints.length; ++i) {
            const constraint = data.constraints[i];

            const constraintValid = Constraint.checkValidity(constraint);

            if (!constraintValid.value) {
                return res400(`Constraint at index ${i}: ${constraintValid.message}`);
            }
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
