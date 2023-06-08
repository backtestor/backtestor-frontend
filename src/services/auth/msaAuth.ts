import { Auth, AuthOptions, BaseAuth } from "./auth";
import { authSessionStore } from "./authStore";
import { GrantType, ResponseMode, ResponseType } from "./constants";
import { AuthCodeRequest } from "./request";
import { AuthCodeResponse } from "./response";

export const msaAuthOptions: AuthOptions = {
  clientId: import.meta.env.PUBLIC_MSA_CLIENT_ID,
  redirectUri: import.meta.env.PUBLIC_MSA_REDIRECT_URI,
  postLogoutRedirectUri: import.meta.env.PUBLIC_MSA_POST_LOGOUT_REDIRECT_URI,
  authority: import.meta.env.PUBLIC_MSA_AUTHORITY,
  authorizationEndpoint: import.meta.env.PUBLIC_MSA_AUTHORIZATION_ENDPOINT,
  tokenEndpoint: import.meta.env.PUBLIC_MSA_TOKEN_ENDPOINT,
  endSessionEndpoint: import.meta.env.PUBLIC_MSA_END_SESSION_ENDPOINT,
};

class MsaAuth extends BaseAuth {
  override getAuthCodeUrl(request: AuthCodeRequest): string {
    this.logger.trace("getAuthCodeUrl called", request.correlationId);
    const parameters: Map<string, string> = new Map<string, string>();

    parameters.set("client_id", encodeURIComponent(this.clientId));
    parameters.set("response_type", encodeURIComponent(request.responseType ?? ResponseType.CODE));
    parameters.set("redirect_uri", encodeURIComponent(this.redirectUri));
    parameters.set("scope", encodeURIComponent(request.scope.join(" ")));
    parameters.set("response_mode", encodeURIComponent(request.responseMode ?? ResponseMode.QUERY));

    if (request.stateObject) parameters.set("state", encodeURIComponent(request.stateObject.encodedState ?? ""));

    if (request.pkceCodes) {
      parameters.set("code_challenge", encodeURIComponent(request.pkceCodes.codeChallenge ?? ""));
      parameters.set("code_challenge_method", encodeURIComponent(request.pkceCodes.codeChallengeMethod ?? ""));
    }

    const queryString: string = Array.from(parameters.entries())
      .map(([key, value]: [string, string]): string => `${key}=${value}`)
      .join("&");

    const authCodeUrl = `${this.authorizationEndpoint}?${queryString}`;

    return authCodeUrl;
  }

  getTokenQueryString(authCodeResponse: AuthCodeResponse): string {
    this.logger.trace("getTokenQueryString called", authCodeResponse.correlationId ?? "");
    const parameters: Map<string, string> = new Map<string, string>();

    parameters.set("client_id", encodeURIComponent(this.clientId));
    parameters.set("scope", encodeURIComponent(authSessionStore.value.scope.join(" ")));
    parameters.set("code", encodeURIComponent(authCodeResponse.code ?? ""));
    parameters.set("redirect_uri", encodeURIComponent(this.redirectUri));
    parameters.set("grant_type", encodeURIComponent(GrantType.AUTHORIZATION_CODE));
    parameters.set("code_verifier", encodeURIComponent(authSessionStore.value.pkceCodes.codeVerifier ?? ""));

    const queryString: string = Array.from(parameters.entries())
      .map(([key, value]: [string, string]): string => `${key}=${value}`)
      .join("&");

    return queryString;
  }
}

export const defineMsaAuth = function defineMsaAuth(options: AuthOptions): Auth {
  const auth = new MsaAuth(options);
  return auth;
};
