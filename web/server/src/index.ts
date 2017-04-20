/*
 * TeamAnneal Web
 * 
 * 
 */
import * as Logger from "./core/Logger";
import * as Application from "./core/Application";
import * as Router from "./core/Router";

const globalLogger = Logger.getGlobal();
const log = Logger.log(globalLogger);

Logger.setLevel(globalLogger)("silly");   // Log everything for now
// Logger.enableLogConsole(globalLogger);
Logger.enableLogFileDailyRotate(globalLogger)(`${__dirname}/../logs`);

log("info")("Logger set up");




log("info")("Initialising Express application");
const app = Application.init();
Application.enableBodyParser(app);
Application.listenOn(app)(8080);
log("info")("Application listening on port 8080");

log("info")("Initialising all routes, under /api");
Router.initAllRoutes(app);








log("info")("Initialisation complete");
