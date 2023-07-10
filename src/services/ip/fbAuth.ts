import { Auth, AuthOptions, BaseAuth } from ".";
import { ipSessionStore } from "./ipStore";
import { AuthCodeResponse, InitializedAuthCodeRequest, Logger, ResponseType, Scope } from "./types";

export const FB_OIDC_DEFAULT_SCOPES: string[] = [Scope.OPENID_SCOPE, Scope.PUBLIC_PROFILE_SCOPE];

export const FB_OIDC_SCOPES: string[] = [...FB_OIDC_DEFAULT_SCOPES, Scope.EMAIL_SCOPE];

class FbAuth extends BaseAuth {
  override getAuthCodeUrl(request: InitializedAuthCodeRequest): string {
    this.logger.trace("getAuthCodeUrl called");
    const parameters: Map<string, string> = new Map<string, string>();

    parameters.set("client_id", encodeURIComponent(this.clientId));
    parameters.set("scope", encodeURIComponent(request.scope.join(" ")));
    parameters.set("redirect_uri", encodeURIComponent(this.redirectUri));
    parameters.set("response_type", encodeURIComponent(ResponseType.CODE));
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
    parameters.set("code", encodeURIComponent(authCodeResponse.code ?? ""));
    parameters.set("redirect_uri", encodeURIComponent(this.redirectUri));
    parameters.set("code_verifier", encodeURIComponent(ipSessionStore.value.pkceCodes.codeVerifier));

    const queryString: string = Array.from(parameters.entries())
      .map(([key, value]: [string, string]): string => `${key}=${value}`)
      .join("&");

    return queryString;
  }
}

export const defineFbAuthOptions = function defineFbAuthOptions(logger: Logger): AuthOptions {
  const options: AuthOptions = {
    logger,
    authority: import.meta.env.PUBLIC_FB_AUTHORITY,
    clientId: import.meta.env.PUBLIC_FB_CLIENT_ID,
    redirectUri: import.meta.env.PUBLIC_FB_REDIRECT_URI,
    authorizationEndpoint: import.meta.env.PUBLIC_FB_AUTHORIZATION_ENDPOINT,
    tokenEndpoint: import.meta.env.PUBLIC_FB_TOKEN_ENDPOINT,
  };
  return options;
};

export const defineFbAuth = function defineFbAuth(options: AuthOptions): Auth {
  const auth = new FbAuth(options);
  return auth;
};
