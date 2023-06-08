import { GrantType, ResponseMode, ResponseType } from "./constants";
import { PkceCodes, StateObject } from "./types";

export interface BaseRequest {
  correlationId?: string | undefined;
}

export interface BaseAuthRequest extends BaseRequest {
  scope: string[];
}

export interface AuthCodeRequest extends BaseAuthRequest {
  responseType?: ResponseType | undefined;
  responseMode?: ResponseMode | undefined;
  stateObject?: StateObject | undefined;
  pkceCodes?: PkceCodes | undefined;
  nonce?: string | undefined;
}

export interface BaseTokenRequest extends BaseAuthRequest {
  grantType?: GrantType | undefined;
}

export interface TokenRequest extends BaseTokenRequest {
  code?: string | undefined;
}

export interface RefreshTokenRequest extends BaseTokenRequest {
  refreshToken?: string | undefined;
}
