import { Auth } from "@src/services/auth";
import { defineMsaAuth, defineMsaAuthOptions } from "@src/services/auth/msaAuth";
import { Logger, addConsoleLogger, defineLogger } from "@src/services/logger";

const defineAppLogger = function defineAppLogger(loggerLevel?: string): Logger {
  const logger: Logger = defineLogger(loggerLevel);
  addConsoleLogger(logger, loggerLevel);
  return logger;
};

export const appLoger: Logger = defineAppLogger();

export const msaAuth: Auth = defineMsaAuth(defineMsaAuthOptions(appLoger));
