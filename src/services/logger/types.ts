export const LogLevel = {
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
  VERBOSE: "verbose",
  TRACE: "trace",
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export type LoggerCallback = (logLevel: LogLevel, message: string) => void;

export interface LoggerOptions {
  logLevel?: LogLevel;
  loggerCallback: LoggerCallback;
}

export interface Logger {
  error(message: string): void;
  warning(message: string): void;
  info(message: string): void;
  verbose(message: string): void;
  trace(message: string): void;
}
