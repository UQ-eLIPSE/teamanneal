import * as express from "express";

// Subrouters
import anneal from "./anneal";
import satisfaction from "./satisfaction";

// =============================================================================

const router = express.Router();

router
    .use("/anneal", anneal)
    .use("/satisfaction", satisfaction);

export default router;
