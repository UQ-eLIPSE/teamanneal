import * as Constraint from "../../../common/Constraint";
import * as HTTPResponseCode from "../core/HTTPResponseCode";

import express from "express";

import * as Data_Constraint from "../data/Constraint";

type DataExtractionFunction = (req: express.Request) => ReadonlyArray<Constraint.Desc>;

export function generate(dataExtractFn: DataExtractionFunction) {
    const middleware: express.RequestHandler = (req, res, next) => {
        // Check `constraints`
        const constraints = dataExtractFn(req);

        for (let i = 0; i < constraints.length; ++i) {
            const constraint = constraints[i];
            const constraintValid = Data_Constraint.checkValidity(constraint);

            if (!constraintValid.value) {
                return res.status(HTTPResponseCode.CLIENT_ERROR.BAD_REQUEST)
                    .json({
                        message: `Constraint at index ${i}: ${constraintValid.message}`,
                    });
            }
        }

        return next();
    };

    return middleware;
}
