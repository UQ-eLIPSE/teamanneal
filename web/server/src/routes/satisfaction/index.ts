import * as express from "express";

import * as ToServerAnnealRequest from "../../../../common/ToServerAnnealRequest";

import * as RecordDataCheckValidity from "../../middleware/RecordDataCheckValidity";
import * as ConstraintCheckValidity from "../../middleware/ConstraintCheckValidity";

// Handlers
import { calculateSatisfaction, testPermutationsMoveRecord, testPermutationsSwapRecord } from "./satisfaction";

// =============================================================================

const router = express.Router();

router
    // Calculate satisfaction
    .post("/calculate",
        // Validation middleware
        // TODO: More input validation
        RecordDataCheckValidity.generate(req => (req.body as ToServerAnnealRequest.Root).recordData),
        ConstraintCheckValidity.generate(req => (req.body as ToServerAnnealRequest.Root).constraints),

        // Run
        calculateSatisfaction)

    .post("/test-permutation/move-record",
        // Validation middleware
        // TODO: More input validation
        RecordDataCheckValidity.generate(req => (req.body as ToServerAnnealRequest.Root).recordData),
        ConstraintCheckValidity.generate(req => (req.body as ToServerAnnealRequest.Root).constraints),

        // Run
        testPermutationsMoveRecord)

    .post("/test-permutation/swap-record",
        // Validation middleware
        // TODO: More input validation
        RecordDataCheckValidity.generate(req => (req.body as ToServerAnnealRequest.Root).recordData),
        ConstraintCheckValidity.generate(req => (req.body as ToServerAnnealRequest.Root).constraints),

        // Run
        testPermutationsSwapRecord)


export default router;
