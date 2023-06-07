import { GrantType, InteractionType, ResponseMode, ResponseType } from "./constants";

export interface StateObject {
  correlationId: string;
  interactionType: InteractionType;
  redirectStartPage?: string;
  meta?: Record<string, string>;
  encodedState?: string;
}

export interface PkceCodes {
  codeVerifier?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

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
