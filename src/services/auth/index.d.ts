import { Logger } from "@services/logger";
export * from "./auth";
export * from "./constants";
export {
  AuthenticationScheme,
  ContentType,
  GrantType,
  HeaderName,
  InteractionType,
  ResponseMode,
  ResponseType,
} from "./constants";

export type AuthenticationScheme = (typeof AuthenticationScheme)[keyof typeof AuthenticationScheme];

export type InteractionType = (typeof InteractionType)[keyof typeof InteractionType];

export type ResponseType = (typeof ResponseType)[keyof typeof ResponseType];

export type ResponseMode = (typeof ResponseMode)[keyof typeof ResponseMode];

export type GrantType = (typeof GrantType)[keyof typeof GrantType];

export type HeaderName = (typeof HeaderName)[keyof typeof HeaderName];

export type ContentType = (typeof ContentType)[keyof typeof ContentType];

export interface AuthOptions {
  logger?: Logger | undefined;
  clientId: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
  authority: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  endSessionEndpoint: string;
}

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

export interface TokenKeys {
  authority: string;
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: Date;
}

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

export interface BaseRequest {
  correlationId?: string | undefined;
}

export interface BaseAuthRequest extends BaseRequest {
  scope?: string[] | undefined;
}

export interface AuthCodeRequest extends BaseAuthRequest {
  redirectStartPage?: string | undefined;
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

export interface Auth {
  getAuthCode(request?: AuthCodeRequest): void;
  handleAuthCodeResponse(): Promise<BaseResponse>;
}
