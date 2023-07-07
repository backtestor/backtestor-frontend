export interface Logger {
  error(message: string): void;
  warning(message: string): void;
  info(message: string): void;
  debug(message: string): void;
  verbose(message: string): void;
  trace(message: string): void;
}

export interface HttpclientErrorResponse {
  message?: string;
  stack?: string;
}

export interface HttpclientResponse {
  status?: string;
  executedAtUtc?: string;
  error?: HttpclientErrorResponse;
}
