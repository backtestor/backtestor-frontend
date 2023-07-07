import { generateGuid } from "@src/utils/uuid";
import { authSessionStore } from "./authStore";
import { ApiRequest, ApiResponse, HeaderName, Httpclient, Logger } from "./types";

const getCurrentUTCTimestamp = function getCurrentUTCTimestamp(): string {
  const now = new Date();
  // Format: "YYYY-MM-DD HH:MM:SS"
  const [utcString] = now.toISOString().replace("T", " ").split(".");
  return `${utcString ?? ""} UTC`;
};

export const getAuthHeaders = function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    [HeaderName.AUTHORIZATION]: `Bearer ${authSessionStore.value.token.token}`,
  };
  return headers;
};

export interface ApiOptions {
  logger: Logger;
  httpclient: Httpclient;
  clientAppId: string;
  baseUrl: string;
}

export abstract class BaseApi {
  logger: Logger;

  httpclient: Httpclient;

  clientAppId: string;

  baseUrl: string;

  constructor(apiOptions: ApiOptions) {
    this.logger = apiOptions.logger;
    this.httpclient = apiOptions.httpclient;
    this.clientAppId = apiOptions.clientAppId;
    this.baseUrl = apiOptions.baseUrl;
  }

  getBaseHeaders(request: ApiRequest): HeadersInit {
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

export const defineApiOptions = function defineApiOptions(logger: Logger, httpclient: Httpclient): ApiOptions {
  const options: ApiOptions = {
    logger,
    httpclient,
    clientAppId: import.meta.env.PUBLIC_API_CLIENT_APP_ID,
    baseUrl: import.meta.env.PUBLIC_API_BASE_URL,
  };
  return options;
};

export const defineApiRequest = function defineApiRequest(
  sessionId?: string,
  correlationId?: string,
  requestId?: string,
): ApiRequest {
  const request = {
    sessionId: sessionId ?? generateGuid(),
    correlationId: correlationId ?? generateGuid(),
    requestId: requestId ?? generateGuid(),
  } as ApiRequest;

  return request;
};
