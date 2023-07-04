import { Logger, addConsoleLogger, defineLogger } from "@src/services/logger";

const defineAppLogger = function defineAppLogger(loggerLevel?: string): Logger {
  const logger: Logger = defineLogger(loggerLevel);
  addConsoleLogger(logger, loggerLevel);
  return logger;
};

export const appLoger: Logger = defineAppLogger();
