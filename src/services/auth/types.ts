import { Logger } from "@src/services/logger";

export const AuthConstants = {
  POPUP_NAME_PREFIX: "auth",
};

export const Scope = {
  OPENID_SCOPE: "openid",
  PROFILE_SCOPE: "profile",
  OFFLINE_ACCESS_SCOPE: "offline_access",
  EMAIL_SCOPE: "email",
};

export const OIDC_DEFAULT_SCOPES: string[] = [Scope.OPENID_SCOPE, Scope.PROFILE_SCOPE];

export const OIDC_SCOPES: string[] = [...OIDC_DEFAULT_SCOPES, Scope.EMAIL_SCOPE];

export const InteractionType = {
  REDIRECT: "redirect",
  POPUP: "popup",
  SILENT: "silent",
  NONE: "none",
} as const;

export type InteractionType = (typeof InteractionType)[keyof typeof InteractionType];

export const AuthenticationScheme = {
  BEARER: "Bearer",
  POP: "pop",
  SSH: "ssh-cert",
} as const;

export type AuthenticationScheme = (typeof AuthenticationScheme)[keyof typeof AuthenticationScheme];

export const ResponseType = {
  CODE: "code",
  ID_TOKEN: "id_token",
  TOKEN: "token",
} as const;

export type ResponseType = (typeof ResponseType)[keyof typeof ResponseType];

export const ResponseMode = {
  QUERY: "query",
  FRAGMENT: "fragment",
  FORM_POST: "form_post",
} as const;

export type ResponseMode = (typeof ResponseMode)[keyof typeof ResponseMode];

export const GrantType = {
  IMPLICIT: "implicit",
  AUTHORIZATION_CODE: "authorization_code",
  CLIENT_CREDENTIALS: "client_credentials",
  RESOURCE_OWNER_PASSWORD: "password",
  REFRESH_TOKEN: "refresh_token",
  DEVICE_CODE: "device_code",
  JWT_BEARER: "urn:ietf:params:oauth:grant-type:jwt-bearer",
} as const;

export type GrantType = (typeof GrantType)[keyof typeof GrantType];

export const HeaderName = {
  CONTENT_TYPE: "Content-Type",
  RETRY_AFTER: "Retry-After",
  CCS_HEADER: "X-AnchorMailbox",
  WWWAuthenticate: "WWW-Authenticate",
  AuthenticationInfo: "Authentication-Info",
  X_MS_REQUEST_ID: "x-ms-request-id",
  X_MS_HTTP_VERSION: "x-ms-httpver",
} as const;

export type HeaderName = (typeof HeaderName)[keyof typeof HeaderName];

export const ContentType = {
  URL_FORM_CONTENT_TYPE: "application/x-www-form-urlencoded;charset=utf-8",
} as const;

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
  errorCode?: string | null;
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
