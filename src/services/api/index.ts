import { ApiResponse, BaseApiRequest, HeaderName, Logger } from "./types";

const getCurrentUTCTimestamp = (): string => {
  const now = new Date();
  // Format: "YYYY-MM-DD HH:MM:SS"
  const [utcString] = now.toISOString().replace("T", " ").split(".");
  return `${utcString ?? ""} UTC`;
};

export interface ApiOptions {
  logger: Logger;
  clientAppId: string;
  baseUrl: string;
}

export interface Api {
  getHeaders(request: BaseApiRequest): HeadersInit;
}

export abstract class BaseApi implements Api {
  logger: Logger;

  clientAppId: string;

  baseUrl: string;

  constructor(apiOptions: ApiOptions) {
    this.logger = apiOptions.logger;
    this.clientAppId = apiOptions.clientAppId;
    this.baseUrl = apiOptions.baseUrl;
  }

  getHeaders(request: BaseApiRequest): HeadersInit {
    const headers: HeadersInit = {
      [HeaderName.CLIENT_APP_ID]: this.clientAppId,
      [HeaderName.SESSION_ID]: request.sessionId,
      [HeaderName.CORRELATION_ID]: request.correlationId,
      [HeaderName.REQUEST_ID]: request.requestId,
    };
    return headers;
  }

  protected parseError(errorCode: string, error: Error | null): ApiResponse {
    this.logger.trace("parseError called");
    const response: ApiResponse = {
      status: "Error",
      executedAtUtc: getCurrentUTCTimestamp(),
      error: {
        message: `${errorCode}: ${error?.message ?? "Unknown error"}`,
        stack: error?.stack ?? "",
      },
    };
    return response;
  }
}

export const defineApiOptions = function defineApiOptions(logger: Logger): ApiOptions {
  const options: ApiOptions = {
    clientAppId: import.meta.env.PUBLIC_API_CLIENT_APP_ID,
    baseUrl: import.meta.env.PUBLIC_API_BASE_URL,
    logger,
  };
  return options;
};
