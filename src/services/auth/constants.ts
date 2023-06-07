export const AuthConstants = {
  PACKAGE_NAME: "Auth",
  POPUP_NAME_PREFIX: "auth",
  OPENID_SCOPE: "openid",
  PROFILE_SCOPE: "profile",
  OFFLINE_ACCESS_SCOPE: "offline_access",
  EMAIL_SCOPE: "email",
};

export const OIDC_DEFAULT_SCOPES: string[] = [AuthConstants.OPENID_SCOPE, AuthConstants.PROFILE_SCOPE];

export const OIDC_SCOPES: string[] = [...OIDC_DEFAULT_SCOPES, AuthConstants.EMAIL_SCOPE];

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
