import { AuthConstants, InteractionType } from "./constants";

const IsBrowserEnvironment: boolean = typeof window !== "undefined";

const isInIframe = function isInIframe(): boolean {
  return window.parent !== window;
};

const isInPopup = function isInPopup(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(window.opener) &&
    window.opener !== window &&
    typeof window.name === "string" &&
    window.name.startsWith(`${AuthConstants.POPUP_NAME_PREFIX}.`)
  );
};

const blockNonBrowserEnvironment = function blockNonBrowserEnvironment(): void {
  if (!IsBrowserEnvironment) throw new Error("The current environment is not a browser environment.");
};

const blockRedirectInIframe = function blockRedirectInIframe(interactionType: InteractionType): void {
  const isIframedApp: boolean = isInIframe();
  if (interactionType === InteractionType.REDIRECT && isIframedApp)
    // If we are not in top frame, we shouldn't redirect.
    throw new Error("Redirect is not supported in an iframe.");
};

const blockAcquireTokenInPopups = function blockAcquireTokenInPopups(): void {
  // Popups opened by auth popup APIs are given a name that starts with AuthConstants.POPUP_NAME_PREFIX.
  if (isInPopup()) throw new Error("AcquireToken is not supported in popups.");
};

export const preflightBrowserEnvironmentCheck = function preflightBrowserEnvironmentCheck(
  interactionType: InteractionType,
): void {
  // Block request if not in browser environment
  blockNonBrowserEnvironment();

  // Block redirects if in an iframe
  blockRedirectInIframe(interactionType);

  // Block redirectUri opened in a popup from calling MSAL APIs
  blockAcquireTokenInPopups();
};
