import * as fs from "fs-extra";
import * as winston from "winston";
import "winston-daily-rotate-file";

type WinstonLogger = winston.Winston | winston.LoggerInstance;
type LogLevelsNPM = "error" | "warn" | "info" | "verbose" | "debug" | "silly";

interface PartialLogFunction {
    (msg: string, callback: winston.LogCallback): winston.LoggerInstance;
    (msg: string, meta: any, callback: winston.LogCallback): winston.LoggerInstance;
    (msg: string, ...meta: any[]): winston.LoggerInstance;
}

/**
 * Initialises a new logger.
 */
export const init =
    () => {
        return new winston.Logger();
    }

/**
 * Returns the global logger.
 */
export const getGlobal =
    () => {
        return winston;
    }

/**
 * Logs to the logger.
 */
export const log =
    (logger: WinstonLogger) =>
        (level: LogLevelsNPM): PartialLogFunction =>
            (msg: string, ...args: any[]) => {
                return logger.log(level, msg, ...args);
            }

export const setLevel =
    (logger: WinstonLogger) =>
        (level: LogLevelsNPM) => {
            logger.level = level;
            return logger;
        }

export const enableLogConsole =
    (logger: WinstonLogger) => {
        logger.add(winston.transports.Console);
        return logger;
    }

export const enableLogFile =
    (logger: WinstonLogger) =>
        (dirPath: string) => {
            // Create folder if directory does not exist
            // NOTE: This is synchronous; this is okay as we should only be 
            //       calling this once when logging is initialised
            fs.ensureDirSync(dirPath);

            logger.add(winston.transports.File, {
                filename: `${dirPath}/winston.log`,
            });

            return logger;
        }

export const enableLogFileDailyRotate =
    (logger: WinstonLogger) =>
        (dirPath: string) => {
            // Create folder if directory does not exist
            // NOTE: This is synchronous; this is okay as we should only be 
            //       calling this once when logging is initialised
            fs.ensureDirSync(dirPath);

            logger.add(winston.transports.DailyRotateFile, {
                filename: `${dirPath}/winston-`,
                datePattern: "yyyyMMdd.log",
                prepend: false,     // Attach date to end of file name
                localTime: false,   // Use UTC
            });

            return logger;
        }
