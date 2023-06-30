export const LogLevel = {
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
  DEBUG: "debug",
  VERBOSE: "verbose",
  TRACE: "trace",
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export type LoggerHook = (logLevel: LogLevel, message: string) => void;

export interface LoggerOptions {
  logLevel?: LogLevel;
}

export interface Logger {
  error(message: string): void;
  warning(message: string): void;
  info(message: string): void;
  debug(message: string): void;
  verbose(message: string): void;
  trace(message: string): void;
  addHook(level: LogLevel, hook: LoggerHook): void;
}
