export interface Logger {
  error(message: string): void;
  warning(message: string): void;
  info(message: string): void;
  debug(message: string): void;
  verbose(message: string): void;
  trace(message: string): void;
}

export const HeaderName = {
  CONTENT_TYPE: "Content-Type",
  AUTHORIZATION: "Authorization",
  CLIENT_APP_ID: "Client-Id",
  SESSION_ID: "Session-id",
  CORRELATION_ID: "Correlation-id",
  REQUEST_ID: "Request-id",
} as const;

export type HeaderName = (typeof HeaderName)[keyof typeof HeaderName];

export interface BaseApiRequest {
  sessionId: string;
  correlationId: string;
  requestId: string;
}

export interface ErrorResponse {
  message?: string;
  stack?: string;
}

export interface ApiResponse {
  status?: string;
  sessionID?: string;
  correlationId?: string;
  requestID?: string;
  executedAtUtc?: string;
  result?: unknown;
  error?: ErrorResponse;
}
