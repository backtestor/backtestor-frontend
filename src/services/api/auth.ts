import { Logger } from "@src/services/logger";
import { ApiImpl, defineApiOptions } from ".";
import { ApiOptions, ApiResponse, BaseApiRequest, ContentType, HeaderName } from "./types";

export interface TokenApiRequest extends BaseApiRequest {
  idToken: string;
}

const AuthApiPath = {
  TOKEN: "/v1/auth/token",
  REVOKE_TOKEN: "/v1/auth/revoke-token",
  LOGOUT: "/v1/auth/logout",
} as const;

type AuthApiPath = (typeof AuthApiPath)[keyof typeof AuthApiPath];

export interface AuthApiOptions extends ApiOptions {
  tokenPath: AuthApiPath;
  revokeTokenPath: AuthApiPath;
  logoutPath: AuthApiPath;
}

export const defineAuthApiOptions = function defineAuthApiOptions(logger?: Logger): AuthApiOptions {
  const apiOptions: ApiOptions = defineApiOptions(logger);
  const options: AuthApiOptions = {
    ...apiOptions,
    tokenPath: AuthApiPath.TOKEN,
    revokeTokenPath: AuthApiPath.REVOKE_TOKEN,
    logoutPath: AuthApiPath.LOGOUT,
  };
  return options;
};

export interface AuthApi {
  getToken(request: TokenApiRequest): Promise<ApiResponse>;
}

export class AuthApiImpl extends ApiImpl implements AuthApi {
  override o: AuthApiOptions;

  constructor(authApiOptions: AuthApiOptions) {
    super(authApiOptions);
    this.o = authApiOptions;
  }

  async getToken(request: TokenApiRequest): Promise<ApiResponse> {
    this.o.logger.verbose("getToken called");
    const tokenUrl = `${this.o.baseUrl}${this.o.tokenPath}`;
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
        const errorResponse: ApiResponse = this.parseError("request_failed", err);
        return errorResponse;
      })) as ApiResponse;

      if (apiResponse.error) this.o.logger.warning(JSON.stringify(apiResponse, null, 2));
      else this.o.logger.debug(JSON.stringify(apiResponse, null, 2));

      return apiResponse;
    } catch (error) {
      const err = error as Error | null;
      const errorResponse: ApiResponse = this.parseError("request_error", err);
      return errorResponse;
    }
  }

  getTokenFormString(request: TokenApiRequest): string {
    this.o.logger.trace("getTokenFormString called");
    const parameters: Map<string, string> = new Map<string, string>();

    parameters.set("id_token", encodeURIComponent(request.idToken));

    const queryString: string = Array.from(parameters.entries())
      .map(([key, value]: [string, string]): string => `${key}=${value}`)
      .join("&");

    return queryString;
  }
}

export const defineAuthApi = function defineAuthApi(authApiOptions: AuthApiOptions): AuthApi {
  const auth = new AuthApiImpl(authApiOptions);
  return auth;
};
