import { StateObject } from "./request";

export interface BaseResponse {
  error?: string | null;
  errorDescription?: string | null;
  errorCodes?: string[] | null;
  timestamp?: string | null;
  traceId?: string | null;
  correlationId?: string | null;
}

export interface AuthCodeResponse extends BaseResponse {
  code?: string | null;
  state?: string | null;
  idToken?: string | null;
}

export interface TokenResponse extends BaseResponse {
  accessToken?: string | null;
  tokenType?: string | null;
  expiresIn?: number | null;
  scope?: string | null;
  refreshToken?: string | null;
  idToken?: string | null;
  stateObject?: StateObject | undefined;
}
