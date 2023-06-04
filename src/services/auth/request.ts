import { AccountInfo } from "./account";

export const AuthenticationScheme = {
  BEARER: "Bearer",
  POP: "pop",
  SSH: "ssh-cert",
} as const;

export type AuthenticationScheme = (typeof AuthenticationScheme)[keyof typeof AuthenticationScheme];

export const ResponseMode = {
  QUERY: "query",
  FRAGMENT: "fragment",
  FORM_POST: "form_post",
} as const;

export type ResponseMode = (typeof ResponseMode)[keyof typeof ResponseMode];

export interface AuthRequest {
  correlationId?: string | undefined;
  scopes?: string[] | undefined;
  authenticationScheme?: AuthenticationScheme | undefined;
  claims?: string | undefined;
  shrNonce?: string | undefined;
  resourceRequestMethod?: string | undefined;
  resourceRequestUri?: string | undefined;
  requestedClaimsHash?: string | undefined;
  maxAge?: number | undefined;
  tokenQueryParameters?: Record<string, string> | undefined;
}

export interface CommonAuthorizationUrlRequest extends AuthRequest {
  responseMode?: ResponseMode | undefined;
  account?: AccountInfo | undefined;
  codeChallenge?: string | undefined;
  codeChallengeMethod?: string | undefined;
  codeVerifier?: string | undefined;
  extraQueryParameters?: Record<string, string> | undefined;
  extraScopesToConsent?: string[] | undefined;
  nonce?: string | undefined;
  prompt?: string | undefined;
  sid?: string | undefined;
  state?: string | undefined;
}

export interface RedirectRequest extends CommonAuthorizationUrlRequest {
  redirectStartPage?: string | undefined;
}
