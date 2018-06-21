import * as Application from "../core/Application";
import * as Router from "../core/Router";

import { Config } from "../utils/Config";

const config = Config.get();

// Port config
const port = config.server.port;

// API root URL
const apiRoot = config.server.api.root;

export function init() {
    // Init the server
    console.log("Initialising Express application");
    const app = Application.init();

    // Enable body parser with 1MB body limit
    Application.enableBodyParser(app, "1mb");

    Application.listenOn(app, port);
    console.log(`Application listening on port ${port}`);

    // Set up static file delivery
    console.log(`Initialising static file delivery`);
    Application.enableStaticFileServing(app, `${__dirname}/../../../../../client/build/client`);

    // Set up routes
    console.log(`Initialising all routes, under "${apiRoot}"`);
    Router.init(app, apiRoot);

    console.log(`Initialisation complete: http://localhost:${port}/`);
}
