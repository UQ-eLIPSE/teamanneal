import * as express from "express";

// Signature of exported function must not be altered for all routers
module.exports = (parentRouter: express.Router) => {
    const router = express.Router();

    router.route("/")
        .get((_req, res, _next) => {
            return res.status(200).send("Anneal API");
        });






    // Attach under /anneal
    parentRouter.use("/anneal", router);

    return router;
}
