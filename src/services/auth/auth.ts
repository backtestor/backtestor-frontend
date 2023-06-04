import { Logger, defineNullLogger } from "@services/logger";
import { PkceCodesResult, generatePkceCodes } from "@src/utils/crypto2";
import { setRequestState } from "@utils/oauth";
import { generateGuid } from "@utils/uuid";
import { AccountEntity, AccountInfo, getAccountInfo } from "./account";
import { authStore } from "./authStore";
import {
  InteractionType,
  IsBrowserEnvironment,
  blockAcquireTokenInPopups,
  blockNonBrowserEnvironment,
  blockRedirectInIframe,
  blockReloadInHiddenIframes,
} from "./browser";
import { AuthenticationScheme, RedirectRequest, ResponseMode } from "./request";

export const EventType = {
  LOGIN_START: "auth:loginStart",
  LOGIN_SUCCESS: "auth:loginSuccess",
  LOGIN_FAILURE: "auth:loginFailure",
  ACQUIRE_TOKEN_START: "auth:acquireTokenStart",
  ACQUIRE_TOKEN_SUCCESS: "auth:acquireTokenSuccess",
  ACQUIRE_TOKEN_FAILURE: "auth:acquireTokenFailure",
  ACQUIRE_TOKEN_NETWORK_START: "auth:acquireTokenFromNetworkStart",
  LOGOUT_START: "auth:logoutStart",
  LOGOUT_SUCCESS: "auth:logoutSuccess",
  LOGOUT_FAILURE: "auth:logoutFailure",
  LOGOUT_END: "auth:logoutEnd",
  RESTORE_FROM_BFCACHE: "auth:restoreFromBFCache",
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];

export interface AuthOptions {
  logger?: Logger;
  clientId: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
  authority: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  endSessionEndpoint: string;
}

export interface Auth {
  loginRedirect(request: RedirectRequest): void;
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
    this.logger = options.logger ?? defineNullLogger();
    this.clientId = options.clientId;
    this.redirectUri = options.redirectUri;
    this.postLogoutRedirectUri = options.postLogoutRedirectUri;
    this.authority = options.authority;
    this.authorizationEndpoint = options.authorizationEndpoint;
    this.tokenEndpoint = options.tokenEndpoint;
    this.endSessionEndpoint = options.endSessionEndpoint;
  }

  abstract loginRedirect(request: RedirectRequest): void;

  protected preflightBrowserEnvironmentCheck(interactionType: InteractionType): void {
    this.logger.verbose("preflightBrowserEnvironmentCheck started");

    // Block request if not in browser environment
    blockNonBrowserEnvironment();

    // Block redirects if in an iframe
    blockRedirectInIframe(interactionType);

    // Block auth requests inside a hidden iframe
    blockReloadInHiddenIframes();

    // Block redirectUri opened in a popup from calling MSAL APIs
    blockAcquireTokenInPopups();
  }

  protected setInteractionInProgress(inProgress: boolean): void {
    this.logger.verbose("setInteractionInProgress started");

    const { interactionStatus } = authStore.value;

    // Set interaction in progress or throw if already set.
    if (inProgress)
      if (interactionStatus && interactionStatus.length > 0)
        // Interaction is in progress. Block request.
        throw new Error("Interaction already in progress for another client");
      else authStore.setKey("interactionStatus", this.clientId);
    else if (interactionStatus === this.clientId) authStore.deleteKey("interactionStatus");
  }

  protected getAllAccounts(): AccountInfo[] {
    this.logger.verbose("getAllAccounts called");

    if (!IsBrowserEnvironment) return [];

    const { accountKeys } = authStore.value;
    if (!accountKeys || accountKeys.length < 1) return [];

    const accountEntities: AccountEntity[] = accountKeys.reduce(
      (accounts: AccountEntity[], key: string): AccountEntity[] => {
        const entity: AccountEntity | null = this.getAccount(key);

        if (!entity) return accounts;

        accounts.push(entity);
        return accounts;
      },
      [],
    );

    if (accountEntities.length < 1) return [];

    const allAccounts: AccountInfo[] = accountEntities.map<AccountInfo>(
      (accountEntity: AccountEntity): AccountInfo => getAccountInfo(accountEntity),
    );

    return allAccounts;
  }

  protected emitEvent(eventName: string, interactionType?: InteractionType, payload?: unknown, error?: unknown): void {
    this.logger.verbose(`Emitting event: ${eventName}`);

    if (!IsBrowserEnvironment) return;

    const customEvent = new CustomEvent(eventName, { detail: { interactionType, payload, error } });

    window.dispatchEvent(customEvent);
  }

  protected async acquireToken(request: RedirectRequest): Promise<void> {
    const validRequest: RedirectRequest = this.initializeAuthorizationRequest(request, InteractionType.Redirect);
    this.updateCacheEntries(validRequest);

    const handleBackButton = (event: PageTransitionEvent): void => {
      // Clear temporary cache if the back button is clicked during the redirect flow.
      if (event.persisted) {
        this.logger.verbose("Page was restored from back/forward cache. Clearing temporary cache.");
        this.cleanRequestByState(validRequest);
        this.emitEvent(EventType.RESTORE_FROM_BFCACHE, InteractionType.Redirect);
      }
    };

    try {
      // Create auth code request and generate PKCE params
      const authCodeRequest: RedirectRequest = await this.initializeAuthorizationCodeRequest(validRequest);

      // Clear temporary cache if the back button is clicked during the redirect flow.
      window.addEventListener("pageshow", handleBackButton);

      // Show the UI once the url has been created. Response will come back in the hash, which will be handled in the handleRedirectCallback function.
      await this.initiateAuthRequest(authCodeRequest);
    } catch (e) {
      window.removeEventListener("pageshow", handleBackButton);
      this.cleanRequestByState(validRequest);
      throw e;
    }
  }

  initiateAuthRequest(request: RedirectRequest): Promise<boolean> {
    this.logger.verbose("initiateAuthRequest called", request.correlationId);
    const DEFAULT_REDIRECT_TIMEOUT_MS = 30000;

    const navigateUrl: string = this.getAuthCodeUrl(request);
    window.location.assign(navigateUrl);

    return new Promise((resolve): void => {
      setTimeout(() => {
        resolve(true);
      }, DEFAULT_REDIRECT_TIMEOUT_MS);
    });
  }

  getAuthCodeUrl(request: RedirectRequest): string {
    this.logger.trace("getAuthCodeUrl called", request.correlationId);
    return "";
  }

  initializeAuthorizationRequest(request: RedirectRequest, interactionType: InteractionType): RedirectRequest {
    this.logger.verbose("initializeAuthorizationRequest called", request.correlationId);

    const state = setRequestState(request.state, {
      interactionType,
    });

    const updatedRequest: RedirectRequest = {
      ...request,
      state,
      nonce: request.nonce ?? generateGuid(),
      responseMode: ResponseMode.FRAGMENT,
      authenticationScheme: request.authenticationScheme ?? AuthenticationScheme.BEARER,
      account: request.account ?? this.getActiveAccount() ?? undefined,
    };

    return updatedRequest;
  }

  async initializeAuthorizationCodeRequest(request: RedirectRequest): Promise<RedirectRequest> {
    const S256_CODE_CHALLENGE_METHOD = "S256";
    this.logger.verbose("initializeAuthorizationCodeRequest called", request.correlationId);
    const generatedPkceParams: PkceCodesResult = await generatePkceCodes();
    return {
      ...request,
      codeChallenge: generatedPkceParams.challenge,
      codeChallengeMethod: S256_CODE_CHALLENGE_METHOD,
      codeVerifier: generatedPkceParams.verifier,
    };
  }

  getActiveAccount(): AccountInfo | null {
    this.logger.trace("getActiveAccount: No active account found");
    return null;
  }

  getAccount(accountKey: string): AccountEntity | null {
    this.logger.trace("getAccount called");

    const { accounts } = authStore.value;
    if (!accounts) return null;

    const account: AccountEntity | undefined = accounts[accountKey];
    if (!account) {
      this.removeAccountKeyFromMap(accountKey);
      return null;
    }

    return account;
  }

  removeAccountKeyFromMap(accountKey: string): void {
    this.logger.trace(`removeAccountKeyFromMap called with key: ${accountKey}`);

    const { accountKeys } = authStore.value;
    if (!accountKeys || accountKeys.length < 1) return;

    const removalIndex = accountKeys.indexOf(accountKey);
    if (removalIndex > -1) {
      accountKeys.splice(removalIndex, 1);
      authStore.setKey("accountKeys", accountKeys);
      this.logger.trace(`Account key: ${accountKey} successfully removed`);
    } else this.logger.trace(`Account key: ${accountKey} not found in cache`);
  }

  updateCacheEntries(_request: RedirectRequest): void {
    this.logger.trace("updateCacheEntries called");
  }

  cleanRequestByState(_request: RedirectRequest): void {
    this.logger.trace("cleanRequestByState called");
  }
}
