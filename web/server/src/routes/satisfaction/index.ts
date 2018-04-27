import * as express from "express";

import * as ToServerAnnealRequest from "../../../../common/ToServerAnnealRequest";

import * as RecordDataCheckValidity from "../../middleware/RecordDataCheckValidity";
import * as ConstraintCheckValidity from "../../middleware/ConstraintCheckValidity";

// Handlers
import { calculateSatisfaction } from "./satisfaction";

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

export default router;
