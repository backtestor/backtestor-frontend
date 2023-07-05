import { Logger } from "@src/services/logger";
import { encode } from "@src/utils/base64";
import { generateGuid } from "@src/utils/uuid";
import { authLocalStore, authSessionStore } from "./authStore";
import { preflightBrowserEnvironmentCheck } from "./browser";
import { generatePkceCodes } from "./pkce";
import {
  Auth,
  AuthCodeRequest,
  AuthCodeResponse,
  AuthOptions,
  AuthResponse,
  ContentType,
  HeaderName,
  InteractionType,
  OIDC_DEFAULT_SCOPES,
  OIDC_SCOPES,
  PkceCodes,
  ResponseMode,
  ResponseType,
  StateObject,
  TokenKeys,
  TokenResponse,
} from "./types";

export * from "./types";

export const defineAuthCodeRequest = function defineAuthCodeRequest(
  redirectStartPage?: string,
  scope?: string[],
  sessionId?: string,
  correlationId?: string,
  requestId?: string,
): AuthCodeRequest {
  const request: AuthCodeRequest = {
    redirectStartPage,
    scope: scope ?? OIDC_SCOPES,
    sessionId: sessionId ?? generateGuid(),
    correlationId: correlationId ?? generateGuid(),
    requestId: requestId ?? generateGuid(),
  };

  return request;
};

const getCurrentUTCTimestamp = (): string => {
  const now = new Date();
  // Format: "YYYY-MM-DD HH:MM:SS"
  const [utcString] = now.toISOString().replace("T", " ").split(".");
  return `${utcString ?? ""} UTC`;
};

const addSecondsToCurrentDateTime = (seconds: number): Date => {
  const now = new Date();
  const milliseconds: number = seconds * 1000;
  const futureDateTime = new Date(now.getTime() + milliseconds);
  return futureDateTime;
};

const decodeParamValue = function decodeParamValue(searchParams: URLSearchParams, paramName: string): string | null {
  const encodedValue: string | null = searchParams.get(paramName);
  return encodedValue === null ? null : decodeURIComponent(encodedValue);
};

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

  abstract getAuthCodeUrl(request: AuthCodeRequest): string;

  abstract getTokenFormString(authCodeResponse: AuthCodeResponse): string;

  async getAuthCode(request?: AuthCodeRequest): Promise<void> {
    this.logger.verbose("getAuthCode called");

    preflightBrowserEnvironmentCheck(InteractionType.REDIRECT);

    const initializedAuthCodeRequest: AuthCodeRequest = this.initializeAuthCodeRequest(
      request ?? defineAuthCodeRequest(),
      InteractionType.REDIRECT,
    );

    try {
      const authCodeRequest: AuthCodeRequest = await this.generatePkceParams(initializedAuthCodeRequest);
      this.updateStoreForAuthRequest(authCodeRequest);

      const navigateUrl: string = this.getAuthCodeUrl(authCodeRequest);
      this.logger.debug(`getAuthCode navigating to: ${navigateUrl}`);
      if (!authLocalStore.value.debugDoNotRedirectOnSignin) window.location.assign(navigateUrl);
    } catch (e) {
      this.cleanStoreForAuthRequest();
      throw e;
    }
  }

  initializeAuthCodeRequest(request: AuthCodeRequest, interactionType: InteractionType): AuthCodeRequest {
    this.logger.trace("initializeAuthCodeRequest called");
    const stateObject: StateObject = this.setState(request, interactionType);

    const scopeSet = new Set([...(request.scope ?? []), ...OIDC_DEFAULT_SCOPES]);
    const scopeArray: string[] = Array.from(scopeSet);

    const initializedAuthCodeRequest: AuthCodeRequest = {
      ...request,
      scope: scopeArray,
      responseType: ResponseType.CODE,
      responseMode: ResponseMode.QUERY,
      stateObject,
      nonce: request.nonce ?? generateGuid(),
    };

    return initializedAuthCodeRequest;
  }

  setState(request: AuthCodeRequest, interactionType: InteractionType, meta?: Record<string, string>): StateObject {
    this.logger.trace("setState called");
    const stateObject: StateObject = {
      sessionId: request.sessionId,
      correlationId: request.correlationId,
      requestId: request.requestId,
      interactionType,
    };

    if (interactionType === InteractionType.REDIRECT)
      stateObject.redirectStartPage = request.redirectStartPage ?? window.location.href;
    if (meta) stateObject.meta = meta;

    const stateString: string = JSON.stringify(stateObject);
    stateObject.encodedState = encode(stateString);

    return stateObject;
  }

  async generatePkceParams(request: AuthCodeRequest): Promise<AuthCodeRequest> {
    this.logger.trace("generatePkceParams called");
    const pkceCodes: PkceCodes = await generatePkceCodes();
    const authCodeRequest: AuthCodeRequest = {
      ...request,
      pkceCodes,
    };

    return authCodeRequest;
  }

  updateStoreForAuthRequest(request: AuthCodeRequest): void {
    this.logger.trace("updateStoreForAuthRequest called");
    authSessionStore.setKey("scope", request.scope);
    authSessionStore.setKey("stateObject", request.stateObject);
    authSessionStore.setKey("pkceCodes", request.pkceCodes);
  }

  protected cleanStoreForAuthRequest(): void {
    this.logger.trace("cleanStoreForAuthRequest called");
    authSessionStore.deleteKey("scope");
    authSessionStore.deleteKey("stateObject");
    authSessionStore.deleteKey("pkceCodes");
  }

  async handleAuthCodeResponse(): Promise<AuthResponse> {
    this.logger.verbose("handleAuthCodeResponse called");
    const authCodeResponse: AuthCodeResponse = this.parseAuthCodeResponse();
    this.validateAuthCodeResponse(authCodeResponse);

    if (authCodeResponse.error)
      this.logger.warning(`getAuthCode not succeeded: ${JSON.stringify(authCodeResponse, null, 2)}`);
    else this.logger.debug(`getAuthCode succeeded: ${JSON.stringify(authCodeResponse, null, 2)}`);

    if (authCodeResponse.error) {
      this.cleanStoreForAuthRequest();
      return authCodeResponse;
    }

    const tokenResponse: TokenResponse = await this.exchangeAuthCodeForToken(authCodeResponse);
    if (tokenResponse.error) {
      this.cleanStoreForAuthRequest();
      return tokenResponse;
    }

    tokenResponse.stateObject = authSessionStore.value.stateObject;
    this.cleanStoreForAuthRequest();

    this.updateStoreWithTokenResponse(tokenResponse);

    return tokenResponse;
  }

  updateStoreWithTokenResponse(tokenResponse: TokenResponse): void {
    this.logger.trace("updateStoreWithTokenResponse called");
    const expiresAtUtc: Date = addSecondsToCurrentDateTime(tokenResponse.expiresIn ?? 0);
    const tokenKeys: TokenKeys = {
      authority: this.authority,
      idToken: tokenResponse.idToken ?? "",
      accessToken: tokenResponse.accessToken ?? "",
      refreshToken: tokenResponse.refreshToken ?? "",
      expiresAtUtc,
    };
    authSessionStore.setKey("tokenKeys", tokenKeys);
  }

  protected parseAuthCodeResponse(): AuthCodeResponse {
    this.logger.trace("parseAuthCodeResponse called");
    const searchParams = new URLSearchParams(location.search);
    const authCodeResponse: AuthCodeResponse = {
      error: decodeParamValue(searchParams, "error"),
      errorDescription: decodeParamValue(searchParams, "error_description"),
      errorCode: decodeParamValue(searchParams, "error_codes"),
      timestamp: decodeParamValue(searchParams, "timestamp") ?? getCurrentUTCTimestamp(),
      traceId: decodeParamValue(searchParams, "trace_id"),
      code: decodeParamValue(searchParams, "code"),
      state: decodeParamValue(searchParams, "state"),
      sessionId: authSessionStore.value.stateObject.sessionId,
      correlationId: authSessionStore.value.stateObject.correlationId,
      requestId: authSessionStore.value.stateObject.requestId,
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
    if (authSessionStore.value.scope.length === 0) {
      response.error = "invalid_state";
      response.errorDescription = "Scope not present in cache";
      return;
    }
    if (!response.state) {
      response.error = "invalid_request";
      response.errorDescription = "Failed to retrieve state from url";
      return;
    }
    if (!authSessionStore.value.stateObject.encodedState) {
      response.error = "invalid_state";
      response.errorDescription = "State not present in cache";
      return;
    }
    if (decodeURIComponent(response.state) !== authSessionStore.value.stateObject.encodedState) {
      response.error = "invalid_state";
      response.errorDescription = "State mismatch";
    }
    if (!authSessionStore.value.pkceCodes.codeVerifier) {
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
        const errorResponse = {
          ...this.parseErrorResponse("request_failed", response),
          sessionId: authCodeResponse.sessionId,
          correlationId: authCodeResponse.correlationId,
          requestId: authCodeResponse.requestId,
        } as AuthResponse;
        this.logger.warning(`exchangeAuthCodeForToken failed: ${JSON.stringify(errorResponse, null, 2)}`);
        return errorResponse;
      }

      const tokenResponseJson: string = JSON.stringify(await response.json());
      const tokenResponse = {
        ...this.parseTokenResponse(tokenResponseJson),
        sessionId: authCodeResponse.sessionId,
        correlationId: authCodeResponse.correlationId,
        requestId: authCodeResponse.requestId,
      } as TokenResponse;

      if (authCodeResponse.error)
        this.logger.warning(`exchangeAuthCodeForToken not succeeded: ${JSON.stringify(tokenResponse, null, 2)}`);
      else this.logger.debug(`exchangeAuthCodeForToken succeeded: ${JSON.stringify(tokenResponse, null, 2)}`);

      return tokenResponse;
    } catch (error) {
      const err = error as Error | null;
      const errorResponse = {
        ...this.parseError("request_error", err),
        sessionId: authCodeResponse.sessionId,
        correlationId: authCodeResponse.correlationId,
        requestId: authCodeResponse.requestId,
      } as AuthResponse;
      this.logger.error(`exchangeAuthCodeForToken error: ${JSON.stringify(errorResponse, null, 2)}`);
      return errorResponse;
    }
  }

  protected parseErrorResponse(errorCode: string, response: Response): AuthResponse {
    this.logger.trace("parseErrorResponse called");
    const errorResponse: AuthResponse = {
      error: errorCode,
      errorDescription: response.statusText,
      errorCode: response.status.toString(),
      timestamp: getCurrentUTCTimestamp(),
    };
    return errorResponse;
  }

  protected parseError(errorCode: string, error: Error | null): AuthResponse {
    this.logger.trace("parseError called");
    const errorResponse: AuthResponse = {
      error: errorCode,
      errorDescription: error?.message ?? "Unknown error",
      errorCode: error?.name ?? "Unknown",
      timestamp: getCurrentUTCTimestamp(),
    };
    return errorResponse;
  }

  protected parseTokenResponse(tokenResponseJson: string): TokenResponse {
    this.logger.trace("parseTokenResponse called");
    const parsedResponse: Record<string, unknown> = JSON.parse(tokenResponseJson);
    const tokenResponse: TokenResponse = {} as TokenResponse;

    if (Object.hasOwn(parsedResponse, "error")) tokenResponse.error = parsedResponse["error"] as string;
    if (Object.hasOwn(parsedResponse, "error_description"))
      tokenResponse.errorDescription = parsedResponse["error_description"] as string;
    if (Object.hasOwn(parsedResponse, "error_codes")) tokenResponse.errorCode = parsedResponse["error_codes"] as string;
    if (Object.hasOwn(parsedResponse, "timestamp")) tokenResponse.timestamp = parsedResponse["timestamp"] as string;
    else tokenResponse.timestamp = getCurrentUTCTimestamp();
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
