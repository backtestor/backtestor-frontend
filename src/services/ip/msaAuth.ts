import { Auth, AuthOptions, BaseAuth } from ".";
import { ipSessionStore } from "./ipStore";
import { AuthCodeResponse, InitializedAuthCodeRequest, Logger, ResponseType, Scope } from "./types";

export const MSA_OIDC_DEFAULT_SCOPES: string[] = [Scope.OPENID_SCOPE, Scope.PROFILE_SCOPE];

export const MSA_OIDC_SCOPES: string[] = [...MSA_OIDC_DEFAULT_SCOPES, Scope.EMAIL_SCOPE];

const ResponseMode = {
  QUERY: "query",
  FRAGMENT: "fragment",
  FORM_POST: "form_post",
} as const;

type ResponseMode = (typeof ResponseMode)[keyof typeof ResponseMode];

const GrantType = {
  IMPLICIT: "implicit",
  AUTHORIZATION_CODE: "authorization_code",
  CLIENT_CREDENTIALS: "client_credentials",
  RESOURCE_OWNER_PASSWORD: "password",
  REFRESH_TOKEN: "refresh_token",
  DEVICE_CODE: "device_code",
  JWT_BEARER: "urn:ietf:params:oauth:grant-type:jwt-bearer",
} as const;

type GrantType = (typeof GrantType)[keyof typeof GrantType];

class MsaAuth extends BaseAuth {
  override getAuthCodeUrl(request: InitializedAuthCodeRequest): string {
    this.logger.trace("getAuthCodeUrl called");
    const parameters: Map<string, string> = new Map<string, string>();

    parameters.set("client_id", encodeURIComponent(this.clientId));
    parameters.set("scope", encodeURIComponent(request.scope.join(" ")));
    parameters.set("redirect_uri", encodeURIComponent(this.redirectUri));
    parameters.set("response_type", encodeURIComponent(ResponseType.CODE));
    parameters.set("response_mode", encodeURIComponent(ResponseMode.QUERY));
    parameters.set("state", encodeURIComponent(request.stateObject.encodedState ?? ""));
    parameters.set("code_challenge", encodeURIComponent(request.pkceCodes.codeChallenge));
    parameters.set("code_challenge_method", encodeURIComponent(request.pkceCodes.codeChallengeMethod));

    const queryString: string = Array.from(parameters.entries())
      .map(([key, value]: [string, string]): string => `${key}=${value}`)
      .join("&");

    const authCodeUrl = `${this.authorizationEndpoint}?${queryString}`;

    return authCodeUrl;
  }

  getTokenFormString(authCodeResponse: AuthCodeResponse): string {
    this.logger.trace("getTokenQueryString called");
    const parameters: Map<string, string> = new Map<string, string>();

    parameters.set("client_id", encodeURIComponent(this.clientId));
    parameters.set("scope", encodeURIComponent(ipSessionStore.value.scope.join(" ")));
    parameters.set("code", encodeURIComponent(authCodeResponse.code ?? ""));
    parameters.set("redirect_uri", encodeURIComponent(this.redirectUri));
    parameters.set("grant_type", encodeURIComponent(GrantType.AUTHORIZATION_CODE));
    parameters.set("code_verifier", encodeURIComponent(ipSessionStore.value.pkceCodes.codeVerifier));

    const queryString: string = Array.from(parameters.entries())
      .map(([key, value]: [string, string]): string => `${key}=${value}`)
      .join("&");

    return queryString;
  }
}

export const defineMsaAuthOptions = function defineMsaAuthOptions(logger: Logger): AuthOptions {
  const options: AuthOptions = {
    logger,
    authority: import.meta.env.PUBLIC_MSA_AUTHORITY,
    clientId: import.meta.env.PUBLIC_MSA_CLIENT_ID,
    redirectUri: import.meta.env.PUBLIC_MSA_REDIRECT_URI,
    authorizationEndpoint: import.meta.env.PUBLIC_MSA_AUTHORIZATION_ENDPOINT,
    tokenEndpoint: import.meta.env.PUBLIC_MSA_TOKEN_ENDPOINT,
  };
  return options;
};

export const defineMsaAuth = function defineMsaAuth(options: AuthOptions): Auth {
  const auth = new MsaAuth(options);
  return auth;
};
