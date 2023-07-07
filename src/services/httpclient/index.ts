import { HttpclientResponse, Logger } from "./types";

const getCurrentUTCTimestamp = function getCurrentUTCTimestamp(): string {
  const now = new Date();
  // Format: "YYYY-MM-DD HH:MM:SS"
  const [utcString] = now.toISOString().replace("T", " ").split(".");
  return `${utcString ?? ""} UTC`;
};

export interface HttpclientOptions {
  logger: Logger;
}

export interface Httpclient {
  post<T extends HttpclientResponse>(name: string, url: string, requestInit: RequestInit): Promise<T>;
}

export class HttpclientImpl implements Httpclient {
  logger: Logger;

  constructor(options: HttpclientOptions) {
    this.logger = options.logger;
  }

  async post<T extends HttpclientResponse>(name: string, url: string, requestInit: RequestInit): Promise<T> {
    this.logger.trace("post called");
    try {
      const response = await fetch(url, requestInit);

      let apiResponse: T = {} as T;

      if (response.headers.get("Content-Type")?.includes("application/json"))
        apiResponse = (await response.json().catch((error): T => {
          const errorResponse: T = this.parseError(`${name} request failed`, error as Error | null);
          this.logger.warning(`${name} failed: ${JSON.stringify(errorResponse, null, 2)}`);
          return errorResponse;
        })) as T;
      else if (response.status < 400)
        apiResponse = {
          status: response.statusText,
          executedAtUtc: getCurrentUTCTimestamp(),
        } as T;
      else apiResponse = this.parseError(response.status.toString(), new Error(response.statusText));

      if (apiResponse.error) {
        this.logger.warning(`${name} not succeeded: ${JSON.stringify(apiResponse, null, 2)}`);
        return apiResponse;
      }

      this.logger.debug(`${name} succeeded: ${JSON.stringify(apiResponse, null, 2)}`);

      return apiResponse;
    } catch (error) {
      const errorResponse: T = this.parseError(`${name} request network error`, error as Error | null);
      this.logger.error(`${name} error: ${JSON.stringify(errorResponse, null, 2)}`);
      return errorResponse;
    }
  }

  protected parseError<T extends HttpclientResponse>(errorCode: string, error: Error | null): T {
    this.logger.trace("parseError called");
    const response: T = {
      status: "Error",
      executedAtUtc: getCurrentUTCTimestamp(),
      error: {
        message: `${errorCode}: ${error?.message ?? "Unknown error"}`,
        stack: error?.stack ?? "",
      },
    } as T;
    return response;
  }
}

export const defineHttpclientOptions = function defineHttpclientOptions(logger: Logger): HttpclientOptions {
  const options: HttpclientOptions = {
    logger,
  };
  return options;
};

export const defineHttpclient = function defineHttpclient(httpclientOptions: HttpclientOptions): Httpclient {
  const httpclient = new HttpclientImpl(httpclientOptions);
  return httpclient;
};
