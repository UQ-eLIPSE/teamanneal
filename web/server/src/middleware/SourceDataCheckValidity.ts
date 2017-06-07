import * as SourceData from "../../../common/SourceData";
import * as HTTPResponseCode from "../core/HTTPResponseCode";

import * as express from "express";

import * as Data_SourceData from "../data/SourceData";

type DataExtractionFunction = (req: express.Request) => SourceData.Desc;

export function generate(dataExtractFn: DataExtractionFunction) {
    const middleware: express.RequestHandler = (req, res, next) => {
        // Check `sourceData`
        const sourceData = dataExtractFn(req);
        const sourceDataValid = Data_SourceData.checkValidity(sourceData);

        if (!sourceDataValid.value) {
            return res.status(HTTPResponseCode.CLIENT_ERROR.BAD_REQUEST)
                .json({
                    message: sourceDataValid.message,
                });
        }

        return next();
    };

    return middleware;
}
