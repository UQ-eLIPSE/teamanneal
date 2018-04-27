import * as express from "express";

import * as ToServerAnnealRequest from "../../../../common/ToServerAnnealRequest";

import * as HTTPResponseCode from "../../core/HTTPResponseCode";
import { calculateSatisfactionFromAnnealRequest } from "../../anneal/ConstraintSatisfaction";

/**
 * Endpoint that ingests a node tree (like that of a normal anneal request) but
 * only returns the satisfaction values of that tree.
 */
export const calculateSatisfaction: express.RequestHandler =
    async (req, res, _next) => {
        // TODO: Split satisfaction calculation into a queue

        try {
            const annealRequest: ToServerAnnealRequest.Root = req.body;
            const { strata, constraints, recordData, annealNodes } = annealRequest;

            // Map out the satisfaction objects per node
            const satisfactionObjects =
                annealNodes.map(annealNode => calculateSatisfactionFromAnnealRequest(annealNode, recordData, strata, constraints));

            return res
                .status(HTTPResponseCode.SUCCESS.ACCEPTED)
                .json(satisfactionObjects);

        } catch (error) {
            console.error(error);

            return res
                .status(HTTPResponseCode.SERVER_ERROR.INTERNAL_SERVER_ERROR)
                .json({ error });

        }
    };
