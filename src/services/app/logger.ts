import { addConsoleLogger, defineLogger } from "@src/services/logger";
import { Logger } from "@src/services/logger/types";

const defineAppLogger = function defineAppLogger(loggerLevel?: string): Logger {
  const logger: Logger = defineLogger(loggerLevel);
  addConsoleLogger(logger, loggerLevel);
  return logger;
};

export const appLoger: Logger = defineAppLogger();
