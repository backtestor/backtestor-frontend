export interface Logger {
  error(message: string): void;
  warning(message: string): void;
  info(message: string): void;
  debug(message: string): void;
  verbose(message: string): void;
  trace(message: string): void;
}

export const Scope = {
  OPENID_SCOPE: "openid",
  PROFILE_SCOPE: "profile",
  OFFLINE_ACCESS_SCOPE: "offline_access",
  EMAIL_SCOPE: "email",
};

export const OIDC_DEFAULT_SCOPES: string[] = [Scope.OPENID_SCOPE, Scope.PROFILE_SCOPE];

export const OIDC_SCOPES: string[] = [...OIDC_DEFAULT_SCOPES, Scope.EMAIL_SCOPE];

export interface StateObject {
  sessionId: string;
  correlationId: string;
  requestId: string;
  redirectStartPage: string;
  encodedState?: string;
}

export interface PkceCodes {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: string;
}

export interface TokenKeys {
  authority: string;
  idToken: string;
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  error?: string;
  errorDescription?: string;
  errorCode?: string;
  timestamp?: string;
  traceId?: string;
  sessionId?: string;
  correlationId?: string;
  requestId?: string;
}

export interface AuthCodeResponse extends AuthResponse {
  code?: string;
  state?: string;
}

export interface TokenResponse extends AuthResponse {
  accessToken?: string;
  tokenType?: string;
  expiresIn?: number;
  scope?: string;
  refreshToken?: string;
  idToken?: string;
  stateObject?: StateObject;
}

export interface AuthCodeRequest {
  sessionId: string;
  correlationId: string;
  requestId: string;
  scope: string[];
  redirectStartPage: string;
}

export interface InitializedAuthCodeRequest extends AuthCodeRequest {
  stateObject: StateObject;
  nonce: string;
  pkceCodes: PkceCodes;
}
