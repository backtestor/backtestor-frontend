import { Logger, defineLogger } from "@src/services/logger";
import { Api, ApiOptions, ApiResponse, BaseApiRequest, HeaderName } from "./types";

export * from "./types";

export const getCurrentUTCTimestamp = (): string => {
  const now = new Date();
  // Format: "YYYY-MM-DD HH:MM:SS"
  const [utcString] = now.toISOString().replace("T", " ").split(".");
  return `${utcString ?? ""} UTC`;
};

export const defineApiOptions = function defineApiOptions(logger?: Logger): ApiOptions {
  const options: ApiOptions = {
    clientAppId: import.meta.env.PUBLIC_API_CLIENT_APP_ID,
    baseUrl: import.meta.env.PUBLIC_API_BASE_URL,
    logger: logger ?? defineLogger(),
  };
  return options;
};

export class ApiImpl implements Api {
  o: ApiOptions;

  constructor(apiOptions: ApiOptions) {
    this.o = apiOptions;
  }

  getHeaders(request: BaseApiRequest): HeadersInit {
    const headers: HeadersInit = {
      [HeaderName.CLIENT_APP_ID]: this.o.clientAppId,
      [HeaderName.SESSION_ID]: request.sessionId,
      [HeaderName.CORRELATION_ID]: request.correlationId,
      [HeaderName.REQUEST_ID]: request.requestId,
    };
    return headers;
  }

  protected parseError(errorCode: string, error: Error | null): ApiResponse {
    this.o.logger.trace("parseError called");
    const response: ApiResponse = {
      status: "Error",
      executedAtUtc: getCurrentUTCTimestamp(),
      error: {
        message: `${errorCode}: ${error?.message ?? "Unknown error"}`,
        stack: error?.stack ?? null,
      },
    };
    this.o.logger.warning(JSON.stringify(response, null, 2));
    return response;
  }
}
