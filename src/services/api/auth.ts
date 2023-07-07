import { generateGuid } from "@src/utils/uuid";
import { ApiOptions, BaseApi, defineApiOptions, getAuthHeaders } from ".";
import { authSessionStore } from "./authStore";
import { ApiRequest, ApiResponse, HeaderName, Httpclient, Logger } from "./types";

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

export interface TokenApiRequest extends ApiRequest {
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
  logout(request: ApiRequest): Promise<ApiResponse>;
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

  async logout(request: ApiRequest): Promise<ApiResponse> {
    this.logger.verbose("logout called");
    const tokenUrl = `${this.baseUrl}${this.logoutPath}`;
    const headers: HeadersInit = {
      ...this.getBaseHeaders(request),
      ...getAuthHeaders(),
    };

    try {
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers,
      });

      let apiResponse: ApiResponse = {};

      if (response.headers.get("Content-Type")?.includes("application/json"))
        apiResponse = (await response.json().catch((error): ApiResponse => {
          const errorResponse = {
            ...this.parseError("logout request failed", error as Error | null),
          } as ApiResponse;
          this.logger.warning(`logout failed: ${JSON.stringify(errorResponse, null, 2)}`);
          return errorResponse;
        })) as ApiResponse;
      else if (response.status < 400)
        apiResponse = {
          status: response.status.toString(),
        };
      else
        apiResponse = {
          ...this.parseError(response.status.toString(), new Error(response.statusText)),
        };

      if (apiResponse.error) {
        this.logger.warning(`logout not succeeded: ${JSON.stringify(apiResponse, null, 2)}`);
        return apiResponse;
      }

      this.logger.debug(`logout succeeded: ${JSON.stringify(apiResponse, null, 2)}`);
      authSessionStore.deleteKey("token");

      return apiResponse;
    } catch (error) {
      const errorResponse = {
        ...this.parseError("logout request network error", error as Error | null),
      } as ApiResponse;
      this.logger.error(`logout error: ${JSON.stringify(errorResponse, null, 2)}`);
      return errorResponse;
    }
  }

  async getToken(request: TokenApiRequest): Promise<ApiResponse> {
    this.logger.verbose("getToken called");
    const tokenUrl = `${this.baseUrl}${this.tokenPath}`;
    const headers: HeadersInit = {
      ...this.getBaseHeaders(request),
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
          ...this.parseError("getToken request failed", err),
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
        ...this.parseError("getToken request network error", err),
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

export const defineAuthApiOptions = function defineAuthApiOptions(
  logger: Logger,
  httpclient: Httpclient,
): AuthApiOptions {
  const apiOptions: ApiOptions = defineApiOptions(logger, httpclient);
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
