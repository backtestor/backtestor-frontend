import { Logger, defineLogger } from "@src/services/logger";
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
  BaseResponse,
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
): AuthCodeRequest {
  const request: AuthCodeRequest = {
    scope: scope ?? OIDC_SCOPES,
    redirectStartPage,
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
    this.logger = options.logger ?? defineLogger();
    this.clientId = options.clientId;
    this.redirectUri = options.redirectUri;
    this.postLogoutRedirectUri = options.postLogoutRedirectUri;
    this.authority = options.authority;
    this.authorizationEndpoint = options.authorizationEndpoint;
    this.tokenEndpoint = options.tokenEndpoint;
    this.endSessionEndpoint = options.endSessionEndpoint;
  }

  abstract getAuthCodeUrl(request: AuthCodeRequest): string;

  abstract getTokenQueryString(authCodeResponse: AuthCodeResponse): string;

  getAuthCode(request?: AuthCodeRequest): void {
    this.logger.verbose("getAuthCode called");
    const authCodeRequest: AuthCodeRequest = request ?? defineAuthCodeRequest();
    authCodeRequest.correlationId ??= generateGuid();

    this.acquireToken(authCodeRequest);
  }

  async acquireToken(request: AuthCodeRequest): Promise<void> {
    this.logger.trace("acquireToken called");
    preflightBrowserEnvironmentCheck(InteractionType.REDIRECT);

    const initializedAuthCodeRequest: AuthCodeRequest = this.initializeAuthCodeRequest(
      request,
      InteractionType.REDIRECT,
    );

    try {
      const authCodeRequest: AuthCodeRequest = await this.generatePkceParams(initializedAuthCodeRequest);
      this.updateStoreForAuthRequest(authCodeRequest);

      const navigateUrl: string = this.getAuthCodeUrl(authCodeRequest);
      this.logger.debug(`acquireToken: Navigating to: ${navigateUrl}`);
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
      correlationId: request.correlationId ?? generateGuid(),
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

  async handleAuthCodeResponse(): Promise<BaseResponse> {
    this.logger.verbose("handleAuthCodeResponse called");
    const authCodeResponse: AuthCodeResponse = this.parseAuthCodeResponse();
    this.validateAuthCodeResponse(authCodeResponse);

    if (authCodeResponse.error) this.logger.warning(JSON.stringify(authCodeResponse, null, 2));
    else this.logger.debug(JSON.stringify(authCodeResponse, null, 2));

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

  protected parseCommonResponseUrlParams(): BaseResponse {
    this.logger.trace("parseCommonResponseUrlParams called");
    const response: AuthCodeResponse = {};

    const searchParams = new URLSearchParams(location.search);
    response.error = decodeParamValue(searchParams, "error");
    response.errorDescription = decodeParamValue(searchParams, "error_description");
    response.errorCode = decodeParamValue(searchParams, "error_codes");

    response.timestamp = decodeParamValue(searchParams, "timestamp") ?? getCurrentUTCTimestamp();
    response.traceId = decodeParamValue(searchParams, "trace_id");
    response.correlationId =
      decodeParamValue(searchParams, "correlation_id") ?? authSessionStore.value.stateObject.correlationId;

    return response;
  }

  protected parseAuthCodeResponse(): AuthCodeResponse {
    this.logger.trace("parseAuthCodeResponseUrlParams called");
    const searchParams = new URLSearchParams(location.search);
    const baseResponse: BaseResponse = this.parseCommonResponseUrlParams();
    const authCodeResponse: AuthCodeResponse = {
      ...baseResponse,
      code: decodeParamValue(searchParams, "code"),
      state: decodeParamValue(searchParams, "state"),
    } as AuthCodeResponse;

    return authCodeResponse;
  }

  protected validateBaseResponse(response: BaseResponse): void {
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
    const queryString: string = this.getTokenQueryString(authCodeResponse);
    const headers: HeadersInit = {
      [HeaderName.CONTENT_TYPE]: ContentType.URL_FORM_CONTENT_TYPE,
    };

    try {
      const response = await fetch(this.tokenEndpoint, {
        method: "POST",
        headers,
        body: queryString,
      });

      if (!response.ok) {
        const errorResponse: BaseResponse = this.parseErrorResponse("request_failed", response);
        return errorResponse;
      }

      const tokenResponseJson: string = JSON.stringify(await response.json());
      const tokenResponse: TokenResponse = this.parseTokenResponse(tokenResponseJson);

      if (authCodeResponse.error) this.logger.warning(JSON.stringify(tokenResponse, null, 2));
      else this.logger.debug(JSON.stringify(tokenResponse, null, 2));

      return tokenResponse;
    } catch (error) {
      const err = error as Error | null;
      const errorResponse: BaseResponse = this.parseError("request_error", err);
      return errorResponse;
    }
  }

  protected parseError(errorCode: string, error: Error | null): BaseResponse {
    this.logger.trace("parseError called");
    const errorResponse: BaseResponse = {
      error: errorCode,
      errorDescription: error?.message ?? "Unknown error",
      errorCode: error?.name ?? "Unknown",
      timestamp: getCurrentUTCTimestamp(),
    };
    this.logger.warning(JSON.stringify(errorResponse, null, 2));
    return errorResponse;
  }

  protected parseErrorResponse(errorCode: string, response: Response): BaseResponse {
    this.logger.trace("parseErrorResponse called");
    const errorResponse: BaseResponse = {
      error: errorCode,
      errorDescription: response.statusText,
      errorCode: response.status.toString(),
      timestamp: getCurrentUTCTimestamp(),
    };
    this.logger.warning(JSON.stringify(errorResponse, null, 2));
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
    if (Object.hasOwn(parsedResponse, "correlation_id"))
      tokenResponse.correlationId = parsedResponse["correlation_id"] as string;
    else tokenResponse.correlationId = authSessionStore.value.stateObject.correlationId;
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
