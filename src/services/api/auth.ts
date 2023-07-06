import { generateGuid } from "@src/utils/uuid";
import { ApiOptions, BaseApi, defineApiOptions } from ".";
import { authSessionStore } from "./authStore";
import { ApiResponse, BaseApiRequest, HeaderName, Logger } from "./types";

const AuthApiPath = {
  TOKEN: "/v1/auth/token",
  REVOKE_TOKEN: "/v1/auth/revoke-token",
  LOGOUT: "/v1/auth/logout",
} as const;

type AuthApiPath = (typeof AuthApiPath)[keyof typeof AuthApiPath];

const ContentType = {
  URL_FORM_CONTENT_TYPE: "application/x-www-form-urlencoded;charset=utf-8",
} as const;

type ContentType = (typeof ContentType)[keyof typeof ContentType];

export interface TokenApiRequest extends BaseApiRequest {
  idToken: string;
}

export interface TokenApiResponse {
  token: string;
  email: string;
  name: string;
  expiresAtUTC: Date;
}

export interface AuthApiOptions extends ApiOptions {
  tokenPath: AuthApiPath;
  revokeTokenPath: AuthApiPath;
  logoutPath: AuthApiPath;
}

export interface AuthApi {
  getToken(request: TokenApiRequest): Promise<ApiResponse>;
}

export class AuthApiImpl extends BaseApi implements AuthApi {
  tokenPath: AuthApiPath;

  revokeTokenPath: AuthApiPath;

  logoutPath: AuthApiPath;

  constructor(authApiOptions: AuthApiOptions) {
    super(authApiOptions);
    this.tokenPath = authApiOptions.tokenPath;
    this.revokeTokenPath = authApiOptions.revokeTokenPath;
    this.logoutPath = authApiOptions.logoutPath;
  }

  async getToken(request: TokenApiRequest): Promise<ApiResponse> {
    this.logger.verbose("getToken called");
    const tokenUrl = `${this.baseUrl}${this.tokenPath}`;
    const headers: HeadersInit = {
      ...this.getHeaders(request),
      [HeaderName.CONTENT_TYPE]: ContentType.URL_FORM_CONTENT_TYPE,
    };
    const formString: string = this.getTokenFormString(request);

    try {
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers,
        body: formString,
      });

      const apiResponse: ApiResponse = (await response.json().catch((error): ApiResponse => {
        const err = error as Error | null;
        const errorResponse = {
          ...this.parseError("request_failed", err),
        } as ApiResponse;
        this.logger.warning(`getToken failed: ${JSON.stringify(errorResponse, null, 2)}`);
        return errorResponse;
      })) as ApiResponse;

      if (apiResponse.error) {
        this.logger.warning(`getToken not succeeded: ${JSON.stringify(apiResponse, null, 2)}`);
        return apiResponse;
      }

      this.logger.debug(`getToken succeeded: ${JSON.stringify(apiResponse, null, 2)}`);
      const tokenResult: TokenApiResponse = apiResponse.result as TokenApiResponse;
      authSessionStore.setKey("token", tokenResult);

      return apiResponse;
    } catch (error) {
      const err = error as Error | null;
      const errorResponse = {
        ...this.parseError("request_error", err),
      } as ApiResponse;
      this.logger.error(`getToken error: ${JSON.stringify(errorResponse, null, 2)}`);
      return errorResponse;
    }
  }

  getTokenFormString(request: TokenApiRequest): string {
    this.logger.trace("getTokenFormString called");
    const parameters: Map<string, string> = new Map<string, string>();

    parameters.set("id_token", encodeURIComponent(request.idToken));

    const queryString: string = Array.from(parameters.entries())
      .map(([key, value]: [string, string]): string => `${key}=${value}`)
      .join("&");

    return queryString;
  }
}

export const defineAuthApiOptions = function defineAuthApiOptions(logger: Logger): AuthApiOptions {
  const apiOptions: ApiOptions = defineApiOptions(logger);
  const options: AuthApiOptions = {
    ...apiOptions,
    tokenPath: AuthApiPath.TOKEN,
    revokeTokenPath: AuthApiPath.REVOKE_TOKEN,
    logoutPath: AuthApiPath.LOGOUT,
  };
  return options;
};

export const defineAuthApi = function defineAuthApi(authApiOptions: AuthApiOptions): AuthApi {
  const auth = new AuthApiImpl(authApiOptions);
  return auth;
};

export const defineTokenApiRequest = function defineTokenApiRequest(
  idToken: string,
  sessionId?: string,
  correlationId?: string,
  requestId?: string,
): TokenApiRequest {
  const request: TokenApiRequest = {
    sessionId: sessionId ?? generateGuid(),
    correlationId: correlationId ?? generateGuid(),
    requestId: requestId ?? generateGuid(),
    idToken,
  };

  return request;
};
