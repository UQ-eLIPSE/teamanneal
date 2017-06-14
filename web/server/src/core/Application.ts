import * as express from "express";
import * as bodyParser from "body-parser";

/**
 * Initialises a new Express application. 
 */
export function init() {
    return express();
}

/**
 * Enables URL-encoded and JSON requests to be accepted via. body-parser in the
 * Express application.
 */
export function enableBodyParser(app: express.Express, bodySizeMax: string | number) {
    app.use(bodyParser.urlencoded({ // Standard form POST
        limit: bodySizeMax,
        extended: true,
    }));
    app.use(bodyParser.json({       // JSON
        limit: bodySizeMax,
    }));

    return app;
}


export function listenOn(app: express.Express, port: number) {
    return app.listen(port);
}


export function enableStaticFileServing(app: express.Express, path: string, options?: any) {
    return app.use(express.static(path, options));
}
