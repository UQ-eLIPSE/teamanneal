import * as express from "express";
import * as bodyParser from "body-parser";

/**
 * Initialises a new Express application. 
 */
export const init =
    () => {
        return express();
    }

/**
 * Enables URL-encoded and JSON requests to be accepted via. body-parser in the
 * Express application.
 */
export const enableBodyParser =
    (app: express.Express) => {
        app.use(bodyParser.urlencoded({  // Standard form POST
            extended: true,
        }));
        app.use(bodyParser.json());      // JSON

        return app;
    }
