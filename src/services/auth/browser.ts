import { getDeserializedHash } from "@src/utils/url";
import { ServerAuthorizationCodeResponse } from "./response";

/* eslint-disable no-shadow */
export enum InteractionType {
  Redirect = "redirect",
  Popup = "popup",
  Silent = "silent",
  None = "none",
}

const POPUP_NAME_PREFIX = "auth";

export const IsBrowserEnvironment: boolean = typeof window !== "undefined";

const isInIframe = function isInIframe(): boolean {
  return window.parent !== window;
};

const isInPopup = function isInPopup(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(window.opener) &&
    window.opener !== window &&
    typeof window.name === "string" &&
    window.name.startsWith(`${POPUP_NAME_PREFIX}.`)
  );
};

export const blockNonBrowserEnvironment = function blockNonBrowserEnvironment(): void {
  if (!IsBrowserEnvironment) throw new Error("The current environment is not a browser environment.");
};

export const blockRedirectInIframe = function blockRedirectInIframe(interactionType: InteractionType): void {
  const isIframedApp: boolean = isInIframe();
  if (interactionType === InteractionType.Redirect && isIframedApp)
    // If we are not in top frame, we shouldn't redirect.
    throw new Error("Redirect is not supported in an iframe.");
};

export const blockReloadInHiddenIframes = function blockReloadInHiddenIframes(): void {
  let isResponseHash = false;
  const { hash } = window.location;
  if (hash.includes("=")) {
    const parameters: ServerAuthorizationCodeResponse = getDeserializedHash<ServerAuthorizationCodeResponse>(hash);
    isResponseHash = Boolean(parameters.code ?? parameters.error_description ?? parameters.error ?? parameters.state);
  } else isResponseHash = false;

  // Return an error if called from the hidden iframe created by the auth silent calls.
  if (isResponseHash && isInIframe()) throw new Error("Frame is not supposed to reload.");
};

export const blockAcquireTokenInPopups = function blockAcquireTokenInPopups(): void {
  // Popups opened by auth popup APIs are given a name that starts with "auth".
  if (isInPopup()) throw new Error("AcquireToken is not supported in popups.");
};
