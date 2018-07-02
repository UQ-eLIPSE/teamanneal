import * as RecordData from "../../../common/RecordData";
import * as HTTPResponseCode from "../core/HTTPResponseCode";

import express from "express";

import * as Data_RecordData from "../data/RecordData";

type DataExtractionFunction = (req: express.Request) => RecordData.Desc;

export function generate(dataExtractFn: DataExtractionFunction) {
    const middleware: express.RequestHandler = (req, res, next) => {
        // Check `recordData`
        const recordData = dataExtractFn(req);
        const recordDataValid = Data_RecordData.checkValidity(recordData);

        if (!recordDataValid.value) {
            return res.status(HTTPResponseCode.CLIENT_ERROR.BAD_REQUEST)
                .json({
                    message: recordDataValid.message,
                });
        }

        return next();
    };

    return middleware;
}
