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

export interface ApiRequest {
  sessionId: string;
  correlationId: string;
  requestId: string;
}

export interface ErrorResponse {
  message?: string;
  stack?: string;
}

export interface BaseApiResponse {
  status?: string;
  executedAtUtc?: string;
  error?: ErrorResponse;
}

export interface ApiResponse extends BaseApiResponse {
  sessionID?: string;
  correlationId?: string;
  requestID?: string;
  result?: unknown;
}

export interface Httpclient {
  post<T extends BaseApiResponse>(name: string, url: string, requestInit: RequestInit): Promise<T>;
}
