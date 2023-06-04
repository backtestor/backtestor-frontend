import { generateGuid } from "@src/utils/uuid";
import { Auth, AuthOptions, BaseAuth, EventType } from "./auth";
import { InteractionType } from "./browser";
import { RedirectRequest } from "./request";

class MsaAuth extends BaseAuth {
  async acquireTokenRedirect(request: RedirectRequest): Promise<void> {
    request.redirectStartPage ||= window.location.href;
    request.correlationId ||= generateGuid();
    this.logger.verbose("acquireTokenRedirect called", request.correlationId);
    this.preflightBrowserEnvironmentCheck(InteractionType.Redirect);
    this.setInteractionInProgress(true);

    // If logged in, emit acquire token events
    const isLoggedIn = this.getAllAccounts().length > 0;
    if (isLoggedIn) this.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Redirect, request);
    else this.emitEvent(EventType.LOGIN_START, InteractionType.Redirect, request);

    const result: Promise<void> = this.acquireToken(request);

    return result.catch((e): never => {
      // If logged in, emit acquire token events
      if (isLoggedIn) this.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Redirect, null, e);
      else this.emitEvent(EventType.LOGIN_FAILURE, InteractionType.Redirect, null, e);

      throw e;
    });
  }

  loginRedirect(request: RedirectRequest): void {
    request.redirectStartPage ||= window.location.href;
    request.correlationId ||= generateGuid();
    this.logger.verbose("loginRedirect called", request.correlationId);
    this.acquireTokenRedirect(request);
  }
}

export const msaAuthOptions: AuthOptions = {
  clientId: import.meta.env.PUBLIC_MSA_CLIENT_ID,
  redirectUri: import.meta.env.PUBLIC_MSA_REDIRECT_URI,
  postLogoutRedirectUri: import.meta.env.PUBLIC_MSA_POST_LOGOUT_REDIRECT_URI,
  authority: import.meta.env.PUBLIC_MSA_AUTHORITY,
  authorizationEndpoint: import.meta.env.PUBLIC_MSA_AUTHORIZATION_ENDPOINT,
  tokenEndpoint: import.meta.env.PUBLIC_MSA_TOKEN_ENDPOINT,
  endSessionEndpoint: import.meta.env.PUBLIC_MSA_END_SESSION_ENDPOINT,
};

export const defineMsaAuth = function defineMsaAuth(options: AuthOptions): Auth {
  const auth = new MsaAuth(options);
  return auth;
};
