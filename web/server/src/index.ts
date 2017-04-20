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

log("info")("Enabling body-parser on Express app");
Application.enableBodyParser(app);


log("info")("Initialising router for /api");
Router.initApiRoutes(app);








log("info")("Initialisation complete");
