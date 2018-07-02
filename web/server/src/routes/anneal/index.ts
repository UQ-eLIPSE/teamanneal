import express from "express";

import * as ToServerAnnealRequest from "../../../../common/ToServerAnnealRequest";

import * as RecordDataCheckValidity from "../../middleware/RecordDataCheckValidity";
import * as ConstraintCheckValidity from "../../middleware/ConstraintCheckValidity";

// Handlers
import { runAnneal, getAnnealStatus, getAnnealResult } from "./anneal";

// =============================================================================

const router = express.Router();

router
    // Execute an anneal
    .post("/",
        // Validation middleware
        // TODO: More input validation
        RecordDataCheckValidity.generate(req => (req.body as ToServerAnnealRequest.Root).recordData),
        ConstraintCheckValidity.generate(req => (req.body as ToServerAnnealRequest.Root).constraints),

        // Run
        runAnneal)

    // Checking up on the status of an anneal
    .get("/anneal-status", getAnnealStatus)

    // Get final anneal result
    .get("/anneal-result", getAnnealResult)

export default router;
