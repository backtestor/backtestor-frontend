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
