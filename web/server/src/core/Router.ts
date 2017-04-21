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
 * Initialises all routes on the supplied Express application at `root`.
 */
export const initAllRoutes =
    (app: express.Express) =>
        (root: string) => {
            // Set up routes
            const router = init(app)(root);

            // Go through all routes
            fs.readdirSync(`${__dirname}/../routes`).forEach((file) => {
                // Only accept files that end with ".js"
                if (file.indexOf(".js") !== file.length - 3) {
                    return;
                }

                const subrouterName = file.substring(0, file.length - 3);   // Remove ".js" at end of `file`

                // Generate subrouter
                log("info")(`Fetching router "${subrouterName}"`);
                const subrouterGenerator = require(`${__dirname}/../routes/${file}`);
                const subrouter = subrouterGenerator();

                // Attach under /<file name>
                log("info")(`Attaching router "${subrouterName}" to "${root}/${subrouterName}"`)
                router.use(`/${subrouterName}`, subrouter);
            });

            return router;
        }
