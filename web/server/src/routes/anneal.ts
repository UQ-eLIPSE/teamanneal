import * as express from "express";

// Signature of exported function must not be altered for all routers
module.exports = () => {
    const router = express.Router();

    router.route("/")
        .get((_req, res, _next) => {
            return res.status(200).send("Anneal API");
        });






    return router;
}
