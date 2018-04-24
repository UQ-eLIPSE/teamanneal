import * as Application from "../core/Application";
import * as Router from "../core/Router";

// TODO: Move configuration into config file

// Port config
const port = 8080;

// API root URL
const apiRoot = "/api";


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
    Application.enableStaticFileServing(app, `${__dirname}/../../../client`);

    // Set up routes
    console.log(`Initialising all routes, under "${apiRoot}"`);
    Router.initAllRoutes(app, apiRoot);

    console.log(`Initialisation complete: http://localhost:${port}/`);
}
