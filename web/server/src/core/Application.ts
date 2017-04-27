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
    (app: express.Express) =>
        (bodySizeMax: string | number) => {
            app.use(bodyParser.urlencoded({ // Standard form POST
                limit: bodySizeMax,
                extended: true,
            }));
            app.use(bodyParser.json({       // JSON
                limit: bodySizeMax,
            }));

            return app;
        }


export const listenOn =
    (app: express.Express) =>
        (port: number) => {
            return app.listen(port);
        }
