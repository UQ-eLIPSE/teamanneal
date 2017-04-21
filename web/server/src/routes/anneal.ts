import * as express from "express";

// Signature of exported function must not be altered for all routers
module.exports = () => {
    const router = express.Router();

    router.route("/")
        .post(PostDataAnnealHandler);

    return router;
}

const PostDataAnnealHandler: express.RequestHandler =
    (req, res, _next) => {
        interface IncomingData {
            readonly sourceData: {
                readonly headers: ReadonlyArray<string>,
                readonly types: ReadonlyArray<number>,
                readonly records: ReadonlyArray<ReadonlyArray<number | string>>,
            },
            readonly constraints: {

            }
        }

        const data: IncomingData = req.body;



        return res
            .status(200)
            .json({
                numberOfRecords: data.sourceData.records.length,
            });
    };
