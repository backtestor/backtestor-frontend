import { encode } from "@src/utils/base64";
import { generateGuid } from "@src/utils/uuid";
import { preflightBrowserEnvironmentCheck } from "./browser";
import { ipLocalStore, ipSessionStore } from "./ipStore";
import { generatePkceCodes } from "./pkce";
import {
  AuthCodeRequest,
  AuthCodeResponse,
  AuthResponse,
  InitializedAuthCodeRequest,
  Logger,
  OIDC_DEFAULT_SCOPES,
  PkceCodes,
  StateObject,
  TokenKeys,
  TokenResponse,
} from "./types";

const HeaderName = {
  CONTENT_TYPE: "Content-Type",
  RETRY_AFTER: "Retry-After",
  CCS_HEADER: "X-AnchorMailbox",
  WWWAuthenticate: "WWW-Authenticate",
  AuthenticationInfo: "Authentication-Info",
  X_MS_REQUEST_ID: "x-ms-request-id",
  X_MS_HTTP_VERSION: "x-ms-httpver",
} as const;

type HeaderName = (typeof HeaderName)[keyof typeof HeaderName];

const ContentType = {
  URL_FORM_CONTENT_TYPE: "application/x-www-form-urlencoded;charset=utf-8",
} as const;

type ContentType = (typeof ContentType)[keyof typeof ContentType];

const getCurrentUTCTimestamp = function getCurrentUTCTimestamp(): string {
  const now = new Date();
  // Format: "YYYY-MM-DD HH:MM:SS"
  const [utcString] = now.toISOString().replace("T", " ").split(".");
  return `${utcString ?? ""} UTC`;
};

const decodeParamValue = function decodeParamValue(searchParams: URLSearchParams, paramName: string): string | null {
  const encodedValue: string | null = searchParams.get(paramName);
  return encodedValue === null ? null : decodeURIComponent(encodedValue);
};

export interface AuthOptions {
  logger: Logger;
  authority: string;
  clientId: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  endSessionEndpoint: string;
}

export interface Auth {
  getAuthCode(request?: AuthCodeRequest): void;
  handleAuthCodeResponse(): Promise<AuthResponse>;
}

export abstract class BaseAuth implements Auth {
  logger: Logger;

  clientId: string;

  redirectUri: string;

  postLogoutRedirectUri: string;

  authority: string;

  authorizationEndpoint: string;

  tokenEndpoint: string;

  endSessionEndpoint: string;

  constructor(options: AuthOptions) {
    this.logger = options.logger;
    this.clientId = options.clientId;
    this.redirectUri = options.redirectUri;
    this.postLogoutRedirectUri = options.postLogoutRedirectUri;
    this.authority = options.authority;
    this.authorizationEndpoint = options.authorizationEndpoint;
    this.tokenEndpoint = options.tokenEndpoint;
    this.endSessionEndpoint = options.endSessionEndpoint;
  }

  abstract getAuthCodeUrl(request: InitializedAuthCodeRequest): string;

  abstract getTokenFormString(authCodeResponse: AuthCodeResponse): string;

  async getAuthCode(request: AuthCodeRequest): Promise<void> {
    this.logger.verbose("getAuthCode called");

    preflightBrowserEnvironmentCheck();

    try {
      const initializedAuthCodeRequest: InitializedAuthCodeRequest = await this.initializeAuthCodeRequest(request);

      this.updateStoreForAuthRequest(initializedAuthCodeRequest);

      const navigateUrl: string = this.getAuthCodeUrl(initializedAuthCodeRequest);
      this.logger.debug(`getAuthCode navigating to: ${navigateUrl}`);
      if (!ipLocalStore.value.debugDoNotRedirectOnSignin) window.location.assign(navigateUrl);
    } catch (e) {
      this.cleanStoreForAuthRequest();
      throw e;
    }
  }

  async initializeAuthCodeRequest(request: AuthCodeRequest): Promise<InitializedAuthCodeRequest> {
    this.logger.trace("initializeAuthCodeRequest called");

    const scopeSet = new Set([...request.scope, ...OIDC_DEFAULT_SCOPES]);
    const scopeArray: string[] = Array.from(scopeSet);

    const stateObject: StateObject = this.setState(request);
    const pkceCodes: PkceCodes = await this.generatePkceParams();

    const initializedAuthCodeRequest: InitializedAuthCodeRequest = {
      ...request,
      scope: scopeArray,
      stateObject,
      nonce: generateGuid(),
      pkceCodes,
    };

    return initializedAuthCodeRequest;
  }

  setState(request: AuthCodeRequest): StateObject {
    this.logger.trace("setState called");
    const stateObject: StateObject = {
      sessionId: request.sessionId,
      correlationId: request.correlationId,
      requestId: request.requestId,
      redirectStartPage: request.redirectStartPage,
    };

    const stateString: string = JSON.stringify(stateObject);
    stateObject.encodedState = encode(stateString);

    return stateObject;
  }

  async generatePkceParams(): Promise<PkceCodes> {
    this.logger.trace("generatePkceParams called");
    const pkceCodes: PkceCodes = await generatePkceCodes();

    return pkceCodes;
  }

  updateStoreForAuthRequest(request: InitializedAuthCodeRequest): void {
    this.logger.trace("updateStoreForAuthRequest called");
    ipSessionStore.setKey("scope", request.scope);
    ipSessionStore.setKey("stateObject", request.stateObject);
    ipSessionStore.setKey("pkceCodes", request.pkceCodes);
  }

  protected cleanStoreForAuthRequest(): void {
    this.logger.trace("cleanStoreForAuthRequest called");
    ipSessionStore.deleteKey("scope");
    ipSessionStore.deleteKey("stateObject");
    ipSessionStore.deleteKey("pkceCodes");
  }

  async handleAuthCodeResponse(): Promise<AuthResponse> {
    this.logger.verbose("handleAuthCodeResponse called");
    const authCodeResponse: AuthCodeResponse = this.parseAuthCodeResponse();
    this.validateAuthCodeResponse(authCodeResponse);

    if (authCodeResponse.error) {
      this.cleanStoreForAuthRequest();
      this.logger.warning(`getAuthCode not succeeded: ${JSON.stringify(authCodeResponse, null, 2)}`);
      return authCodeResponse;
    }

    this.logger.debug(`getAuthCode succeeded: ${JSON.stringify(authCodeResponse, null, 2)}`);

    const tokenResponse: TokenResponse = await this.exchangeAuthCodeForToken(authCodeResponse);
    if (tokenResponse.error) {
      this.cleanStoreForAuthRequest();
      return tokenResponse;
    }

    tokenResponse.stateObject = ipSessionStore.value.stateObject;
    this.cleanStoreForAuthRequest();

    this.updateStoreWithTokenResponse(tokenResponse);

    return tokenResponse;
  }

  updateStoreWithTokenResponse(tokenResponse: TokenResponse): void {
    this.logger.trace("updateStoreWithTokenResponse called");
    const tokenKeys: TokenKeys = {
      authority: this.authority,
      idToken: tokenResponse.idToken ?? "",
      accessToken: tokenResponse.accessToken ?? "",
      refreshToken: tokenResponse.refreshToken ?? "",
    };
    ipSessionStore.setKey("tokenKeys", tokenKeys);
    ipLocalStore.setKey("authority", this.authority);
  }

  protected parseAuthCodeResponse(): AuthCodeResponse {
    this.logger.trace("parseAuthCodeResponse called");
    const { stateObject } = ipSessionStore.value;
    const searchParams = new URLSearchParams(location.search);
    const authCodeResponse: AuthCodeResponse = {
      error: decodeParamValue(searchParams, "error"),
      errorDescription: decodeParamValue(searchParams, "error_description"),
      errorCode: decodeParamValue(searchParams, "error_codes"),
      timestamp: decodeParamValue(searchParams, "timestamp"),
      traceId: decodeParamValue(searchParams, "trace_id"),
      code: decodeParamValue(searchParams, "code"),
      state: decodeParamValue(searchParams, "state"),
      sessionId: stateObject.sessionId,
      correlationId: stateObject.correlationId,
      requestId: stateObject.requestId,
    } as AuthCodeResponse;

    return authCodeResponse;
  }

  protected validateBaseResponse(response: AuthResponse): void {
    this.logger.trace("validateBaseResponse called");
    // Implement throtling logic here, see checkResponseStatus and checkResponseForRetryAfter in msal-browser
    if ((response.errorDescription || response.errorCode) && !response.error) response.error = "invalid_request";
  }

  protected validateAuthCodeResponse(response: AuthCodeResponse): void {
    this.logger.trace("validateAuthCodeResponse called");
    this.validateBaseResponse(response);

    if (response.error) return;

    if (!response.code) {
      response.error = "invalid_request";
      response.errorDescription = "Failed to retrieve auth code from url";
      return;
    }
    if (ipSessionStore.value.scope.length === 0) {
      response.error = "invalid_state";
      response.errorDescription = "Scope not present in cache";
      return;
    }
    if (!response.state) {
      response.error = "invalid_request";
      response.errorDescription = "Failed to retrieve state from url";
      return;
    }
    if (!ipSessionStore.value.stateObject.encodedState) {
      response.error = "invalid_state";
      response.errorDescription = "State not present in cache";
      return;
    }
    if (decodeURIComponent(response.state) !== ipSessionStore.value.stateObject.encodedState) {
      response.error = "invalid_state";
      response.errorDescription = "State mismatch";
    }
    if (!ipSessionStore.value.pkceCodes.codeVerifier) {
      response.error = "invalid_state";
      response.errorDescription = "Code verifier not present in cache";
    }
  }

  async exchangeAuthCodeForToken(authCodeResponse: AuthCodeResponse): Promise<TokenResponse> {
    this.logger.verbose("exchangeAuthCodeForToken called");
    const formString: string = this.getTokenFormString(authCodeResponse);
    const headers: HeadersInit = {
      [HeaderName.CONTENT_TYPE]: ContentType.URL_FORM_CONTENT_TYPE,
    };

    try {
      const response = await fetch(this.tokenEndpoint, {
        method: "POST",
        headers,
        body: formString,
      });

      if (!response.ok) {
        const errorResponse: AuthResponse = this.parseErrorResponse("request_failed", response, authCodeResponse);
        this.logger.warning(`exchangeAuthCodeForToken failed: ${JSON.stringify(errorResponse, null, 2)}`);
        return errorResponse;
      }

      const tokenResponseJson: string = JSON.stringify(await response.json());
      const tokenResponse: TokenResponse = this.parseTokenResponse(tokenResponseJson, authCodeResponse);

      if (authCodeResponse.error) {
        this.logger.warning(`exchangeAuthCodeForToken not succeeded: ${JSON.stringify(tokenResponse, null, 2)}`);
        return tokenResponse;
      }

      this.logger.debug(`exchangeAuthCodeForToken succeeded: ${JSON.stringify(tokenResponse, null, 2)}`);

      return tokenResponse;
    } catch (error) {
      const err = error as Error | null;
      const errorResponse: AuthResponse = this.parseError("request_error", err, authCodeResponse);
      this.logger.error(`exchangeAuthCodeForToken error: ${JSON.stringify(errorResponse, null, 2)}`);
      return errorResponse;
    }
  }

  protected parseErrorResponse(
    errorCode: string,
    response: Response,
    authCodeResponse: AuthCodeResponse,
  ): AuthResponse {
    this.logger.trace("parseErrorResponse called");
    const errorResponse = {
      error: errorCode,
      errorDescription: response.statusText,
      errorCode: response.status.toString(),
      timestamp: getCurrentUTCTimestamp(),
      sessionId: authCodeResponse.sessionId,
      correlationId: authCodeResponse.correlationId,
      requestId: authCodeResponse.requestId,
    } as AuthResponse;
    return errorResponse;
  }

  protected parseError(errorCode: string, error: Error | null, authCodeResponse: AuthCodeResponse): AuthResponse {
    this.logger.trace("parseError called");
    const errorResponse = {
      error: errorCode,
      errorDescription: error?.message ?? "Unknown error",
      errorCode: error?.name ?? "Unknown",
      timestamp: getCurrentUTCTimestamp(),
      sessionId: authCodeResponse.sessionId,
      correlationId: authCodeResponse.correlationId,
      requestId: authCodeResponse.requestId,
    } as AuthResponse;
    return errorResponse;
  }

  protected parseTokenResponse(tokenResponseJson: string, authCodeResponse: AuthCodeResponse): TokenResponse {
    this.logger.trace("parseTokenResponse called");
    const parsedResponse: Record<string, unknown> = JSON.parse(tokenResponseJson);
    const tokenResponse = {
      sessionId: authCodeResponse.sessionId,
      correlationId: authCodeResponse.correlationId,
      requestId: authCodeResponse.requestId,
    } as TokenResponse;

    if (Object.hasOwn(parsedResponse, "error")) tokenResponse.error = parsedResponse["error"] as string;
    if (Object.hasOwn(parsedResponse, "error_description"))
      tokenResponse.errorDescription = parsedResponse["error_description"] as string;
    if (Object.hasOwn(parsedResponse, "error_codes")) tokenResponse.errorCode = parsedResponse["error_codes"] as string;
    if (Object.hasOwn(parsedResponse, "timestamp")) tokenResponse.timestamp = parsedResponse["timestamp"] as string;
    if (Object.hasOwn(parsedResponse, "trace_id")) tokenResponse.traceId = parsedResponse["trace_id"] as string;
    if (Object.hasOwn(parsedResponse, "access_token"))
      tokenResponse.accessToken = parsedResponse["access_token"] as string;
    if (Object.hasOwn(parsedResponse, "token_type")) tokenResponse.tokenType = parsedResponse["token_type"] as string;
    if (Object.hasOwn(parsedResponse, "expires_in")) tokenResponse.expiresIn = parsedResponse["expires_in"] as number;
    if (Object.hasOwn(parsedResponse, "scope")) tokenResponse.scope = parsedResponse["scope"] as string;
    if (Object.hasOwn(parsedResponse, "refresh_token"))
      tokenResponse.refreshToken = parsedResponse["refresh_token"] as string;
    if (Object.hasOwn(parsedResponse, "id_token")) tokenResponse.idToken = parsedResponse["id_token"] as string;

    return tokenResponse;
  }
}

export const defineAuthCodeRequest = function defineAuthCodeRequest(
  redirectStartPage: string,
  scope: string[],
  sessionId?: string,
  correlationId?: string,
  requestId?: string,
): AuthCodeRequest {
  const request: AuthCodeRequest = {
    sessionId: sessionId ?? generateGuid(),
    correlationId: correlationId ?? generateGuid(),
    requestId: requestId ?? generateGuid(),
    scope,
    redirectStartPage,
  };

  return request;
};
