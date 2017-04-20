import * as Logger from "./Logger";

import * as fs from "fs-extra";
import * as express from "express";

const globalLogger = Logger.getGlobal();
const log = Logger.log(globalLogger);

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
export const initAllRoutes =
    (app: express.Express) => {
        // Set up API routes
        const router = init(app)("/api");

        // Go through all routes
        fs.readdirSync(`${__dirname}/../routes`).forEach((file) => {
            // Only accept files that end with ".js"
            if (file.indexOf(".js") !== file.length - 3) {
                return;
            }

            // Grab the subrouter config
            const subrouter = require(`${__dirname}/../routes/${file}`);

            // Pass in parent router (`router`) into the subrouter config
            log("info")(`Setting up router: ${file}`);
            subrouter(router);
        });

        return router;
    }
