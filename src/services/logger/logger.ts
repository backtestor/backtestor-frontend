/* eslint-disable no-console */
export const LogLevel = {
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
  VERBOSE: "verbose",
  TRACE: "trace",
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export type LoggerCallback = (
  logLevel: LogLevel,
  message: string,
  correlationId: string | undefined,
  packageName: string | undefined,
) => void;

export interface LoggerOptions {
  logLevel?: LogLevel;
  loggerCallback: LoggerCallback;
  correlationId?: string;
}

export interface Logger {
  error(message: string, correlationId?: string): void;
  warning(message: string, correlationId?: string): void;
  info(message: string, correlationId?: string): void;
  verbose(message: string, correlationId?: string): void;
  trace(message: string, correlationId?: string): void;
}

export const mapStringToLogLevel = function mapStringToLogLevel(logLevelString: string): LogLevel {
  switch (logLevelString) {
    case "error":
      return LogLevel.ERROR;
    case "warning":
      return LogLevel.WARNING;
    case "info":
      return LogLevel.INFO;
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
  verbose: 4,
  trace: 5,
};

const nullLoggerCallback: LoggerCallback = (): void => {
  // Intentionally empty
};

const consoleLoggerCallback: LoggerCallback = function consoleLoggerCallback(
  level: LogLevel,
  message: string,
  correlationId: string | undefined,
  packageName: string | undefined,
): void {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} [${level}]${correlationId ? `[${correlationId}]` : ""}${
    packageName ? `[${packageName}]` : ""
  } ${message}`;
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

  correlationId: string | undefined;

  packageName: string | undefined;

  constructor(options: LoggerOptions, packageName?: string) {
    this.logLevel = typeof options.logLevel === "undefined" ? LogLevel.INFO : options.logLevel;
    this.loggerCallback = options.loggerCallback;
    this.correlationId = options.correlationId;
    this.packageName = packageName;
  }

  logMessage(level: LogLevel, message: string, correlationId?: string): void {
    const currentLevel: number = logLevelMapping[this.logLevel];
    const providedLevel: number = logLevelMapping[level];

    if (providedLevel > currentLevel) return;

    this.loggerCallback?.(level, message, correlationId ?? this.correlationId, this.packageName);
  }

  error(message: string, correlationId?: string): void {
    this.logMessage(LogLevel.ERROR, message, correlationId);
  }

  warning(message: string, correlationId?: string): void {
    this.logMessage(LogLevel.WARNING, message, correlationId);
  }

  info(message: string, correlationId?: string): void {
    this.logMessage(LogLevel.INFO, message, correlationId);
  }

  verbose(message: string, correlationId?: string): void {
    this.logMessage(LogLevel.VERBOSE, message, correlationId);
  }

  trace(message: string, correlationId?: string): void {
    this.logMessage(LogLevel.TRACE, message, correlationId);
  }
}

export const defineLogger = function defineLogger(options: LoggerOptions, packageName?: string): Logger {
  const logger = new LoggerImpl(options, packageName);
  return logger;
};

export const defineNullLogger = function defineNullLogger(logLevel?: LogLevel, packageName?: string): Logger {
  const options: LoggerOptions = {
    logLevel: logLevel ?? LogLevel.INFO,
    loggerCallback: nullLoggerCallback,
  };

  return defineLogger(options, packageName);
};

export const defineConsoleLogger = function defineConsoleLogger(logLevel?: LogLevel, packageName?: string): Logger {
  const options: LoggerOptions = {
    logLevel: logLevel ?? LogLevel.INFO,
    loggerCallback: consoleLoggerCallback,
  };

  return defineLogger(options, packageName);
};
