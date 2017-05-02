/*
 * TeamAnneal Web
 * 
 * 
 */
import * as Logger from "./core/Logger";
import * as Application from "./core/Application";
import * as Router from "./core/Router";

// API root URL
const apiRoot = "/api";

// Logger
const globalLogger = Logger.getGlobal();
const log = Logger.log(globalLogger);




// Set up logs
Logger.setLevel(globalLogger)("silly");   // Log everything for now
Logger.enableLogConsole(globalLogger);
Logger.enableLogFileDailyRotate(globalLogger)(`${__dirname}/../logs`);

log("info")("Logger set up");



// Init the server
log("info")("Initialising Express application");
const app = Application.init();

// Enable body parser with 1MB body limit
Application.enableBodyParser(app, "1mb");

Application.listenOn(app, 8080);
log("info")("Application listening on port 8080");


// Set up routes
log("info")(`Initialising all routes, under "${apiRoot}"`);
Router.initAllRoutes(app)(apiRoot);





log("info")("Initialisation complete");
