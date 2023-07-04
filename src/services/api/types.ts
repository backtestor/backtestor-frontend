import { Logger } from "@src/services/logger";

export const HeaderName = {
  CONTENT_TYPE: "Content-Type",
  AUTHORIZATION: "Authorization",
  CLIENT_APP_ID: "Client-Id",
  SESSION_ID: "Session-id",
  CORRELATION_ID: "Correlation-id",
  REQUEST_ID: "Request-id",
} as const;

export type HeaderName = (typeof HeaderName)[keyof typeof HeaderName];

export const ContentType = {
  URL_FORM_CONTENT_TYPE: "application/x-www-form-urlencoded;charset=utf-8",
} as const;

export type ContentType = (typeof ContentType)[keyof typeof ContentType];

export interface ApiOptions {
  logger: Logger;
  clientAppId: string;
  baseUrl: string;
}

export interface BaseApiRequest {
  sessionId: string;
  correlationId: string;
  requestId: string;
}

export interface Api {
  getHeaders(request: BaseApiRequest): HeadersInit;
}

export interface ErrorResponse {
  message?: string | null;
  stack?: string | null;
}

export interface ApiResponse {
  status?: string | null;
  sessionID?: string | null;
  correlationId?: string | null;
  requestID?: string | null;
  executedAtUtc?: string | null;
  result?: unknown | null;
  error?: ErrorResponse | null;
}
