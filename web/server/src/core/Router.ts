import * as express from "express";

// Routes
import routes from "../routes";

/**
 * Creates a new Express router object and attaches router at specified path.
 */
export function init(app: express.Express, path: string) {
    const router = routes;
    app.use(path, router);

    return router;
}
