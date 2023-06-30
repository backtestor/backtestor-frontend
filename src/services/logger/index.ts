/* eslint-disable no-console */

import { LogLevel, Logger, LoggerHook, LoggerOptions } from "./types";

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

const nullLoggerCallback: LoggerHook = (): void => {
  // Intentionally empty
};

const consoleLoggerCallback: LoggerHook = function consoleLoggerCallback(level: LogLevel, message: string): void {
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

interface HookDefinition {
  loggerHook: LoggerHook;
  logLevel: LogLevel;
}

class LoggerImpl implements Logger {
  logLevel: LogLevel;

  hooks: HookDefinition[] = [];

  constructor(options: LoggerOptions) {
    this.logLevel = typeof options.logLevel === "undefined" ? LogLevel.INFO : options.logLevel;
  }

  logMessage(logLevel: LogLevel, message: string): void {
    const definedLevel: number = logLevelMapping[this.logLevel];
    const providedLevel: number = logLevelMapping[logLevel];

    if (providedLevel > definedLevel) return;

    this.hooks.forEach((hookDefinition): void => {
      const hookLevel: number = logLevelMapping[hookDefinition.logLevel];
      if (providedLevel > hookLevel) return;
      hookDefinition.loggerHook(logLevel, message);
    });
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

  addHook(level: LogLevel, hook: LoggerHook): void {
    const hookDefinition: HookDefinition = {
      loggerHook: hook,
      logLevel: level,
    };
    this.hooks.push(hookDefinition);
  }
}

export const defineLogger = function defineLogger(loggerLevel?: string): Logger {
  const logLevelString: string = loggerLevel ?? import.meta.env.PUBLIC_LOG_LEVEL;
  const logLevel: LogLevel = mapStringToLogLevel(logLevelString);
  const options: LoggerOptions = {
    logLevel,
  };
  const logger = new LoggerImpl(options);
  return logger;
};

export const addNullHook = function addNullHook(logger: Logger, loggerLevel?: string): void {
  const logLevelString: string = loggerLevel ?? import.meta.env.PUBLIC_LOG_LEVEL;
  const logLevel: LogLevel = mapStringToLogLevel(logLevelString);
  logger.addHook(logLevel, nullLoggerCallback);
};

export const addConsoleLogger = function addConsoleLogger(logger: Logger, loggerLevel?: string): void {
  const logLevelString: string = loggerLevel ?? import.meta.env.PUBLIC_LOG_LEVEL;
  const logLevel: LogLevel = mapStringToLogLevel(logLevelString);
  logger.addHook(logLevel, consoleLoggerCallback);
};
