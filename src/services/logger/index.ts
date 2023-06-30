/* eslint-disable no-console */

import { LogLevel, Logger, LoggerCallback, LoggerOptions } from "./types";

export * from "./types";

const mapStringToLogLevel = function mapStringToLogLevel(logLevelString: string): LogLevel {
  switch (logLevelString) {
    case "error":
      return LogLevel.ERROR;
    case "warning":
      return LogLevel.WARNING;
    case "info":
      return LogLevel.INFO;
    case "debug":
      return LogLevel.DEBUG;
    case "verbose":
      return LogLevel.VERBOSE;
    case "trace":
      return LogLevel.TRACE;
    default:
      return LogLevel.INFO;
  }
};

const logLevelMapping: Record<LogLevel, number> = {
  error: 1,
  warning: 2,
  info: 3,
  debug: 4,
  verbose: 5,
  trace: 6,
};

const nullLoggerCallback: LoggerCallback = (): void => {
  // Intentionally empty
};

const consoleLoggerCallback: LoggerCallback = function consoleLoggerCallback(level: LogLevel, message: string): void {
  const timestamp: string = new Date().toISOString();
  const logMessage = `${timestamp} [${level}] ${message}`;
  switch (level) {
    case LogLevel.ERROR:
      console.error(logMessage);
      break;
    case LogLevel.WARNING:
      console.warn(logMessage);
      break;
    case LogLevel.INFO:
      console.info(logMessage);
      break;
    case LogLevel.DEBUG:
      console.debug(logMessage);
      break;
    case LogLevel.VERBOSE:
      console.debug(logMessage);
      break;
    case LogLevel.TRACE:
      console.trace(logMessage);
      break;
    default:
      console.log(logMessage);
      break;
  }
};

class LoggerImpl implements Logger {
  logLevel: LogLevel;

  loggerCallback?: LoggerCallback;

  constructor(options: LoggerOptions) {
    this.logLevel = typeof options.logLevel === "undefined" ? LogLevel.INFO : options.logLevel;
    this.loggerCallback = options.loggerCallback;
  }

  logMessage(level: LogLevel, message: string): void {
    const definedLevel: number = logLevelMapping[this.logLevel];
    const providedLevel: number = logLevelMapping[level];

    if (providedLevel > definedLevel) return;

    this.loggerCallback?.(level, message);
  }

  error(message: string): void {
    this.logMessage(LogLevel.ERROR, message);
  }

  warning(message: string): void {
    this.logMessage(LogLevel.WARNING, message);
  }

  info(message: string): void {
    this.logMessage(LogLevel.INFO, message);
  }

  debug(message: string): void {
    this.logMessage(LogLevel.DEBUG, message);
  }

  verbose(message: string): void {
    this.logMessage(LogLevel.VERBOSE, message);
  }

  trace(message: string): void {
    this.logMessage(LogLevel.TRACE, message);
  }
}

export const defineLogger = function defineLogger(options: LoggerOptions): Logger {
  const logger = new LoggerImpl(options);
  return logger;
};

export const defineNullLogger = function defineNullLogger(loggerLevel?: string): Logger {
  const logLevelString: string = loggerLevel ?? import.meta.env.PUBLIC_LOG_LEVEL;
  const logLevel: LogLevel = mapStringToLogLevel(logLevelString);
  const options: LoggerOptions = {
    logLevel,
    loggerCallback: nullLoggerCallback,
  };

  return defineLogger(options);
};

export const defineConsoleLogger = function defineConsoleLogger(loggerLevel?: string): Logger {
  const logLevelString: string = loggerLevel ?? import.meta.env.PUBLIC_LOG_LEVEL;
  const logLevel: LogLevel = mapStringToLogLevel(logLevelString);
  const options: LoggerOptions = {
    logLevel,
    loggerCallback: consoleLoggerCallback,
  };

  return defineLogger(options);
};
