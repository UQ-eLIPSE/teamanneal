import * as express from "express";

/**
 * Creates a new Express router object and attaches router at specified path.
 */
export const init =
    (app: express.Express) =>
        (path: string) => {
            const router = express.Router();
            app.use(path, router);

            return router;
        }

/**
 * Initialises all API routes on the supplied Express application at "/api".
 */
export const initApiRoutes =
    (app: express.Express) => {
        // Set up API routes
        const router = init(app)("/api");

        return router;
    }
