import { getLanguageFromPath } from "@src/i18n";
import { Auth, defineAuthCodeRequest } from "@src/services/ip";
import { FB_OIDC_SCOPES, defineFbAuth, defineFbAuthOptions } from "@src/services/ip/fbAuth";
import { ipLocalStore } from "@src/services/ip/ipStore";
import { MSA_OIDC_SCOPES, defineMsaAuth, defineMsaAuthOptions } from "@src/services/ip/msaAuth";
import { appSessionStore } from "./appStore";
import { appLoger } from "./logger";

const getSigninUrl = function getSigninUrl(): string {
  const { pathname } = window.location;
  const lang: string | null = getLanguageFromPath(pathname);
  const signinUrl = `${lang ? `/${lang}` : ""}/signin`;
  return signinUrl;
};

export const msaAuth: Auth = defineMsaAuth(defineMsaAuthOptions(appLoger));

export const fbAuth: Auth = defineFbAuth(defineFbAuthOptions(appLoger));

export const signinMsa = function signinMsa(returnUrl: string): void {
  msaAuth.getAuthCode(defineAuthCodeRequest(returnUrl, MSA_OIDC_SCOPES, appSessionStore.value.sessionId));
};

export const signinFb = function signinFb(returnUrl: string): void {
  fbAuth.getAuthCode(defineAuthCodeRequest(returnUrl, FB_OIDC_SCOPES, appSessionStore.value.sessionId));
};

export const signin = function signin(returnUrl: string): void {
  const signinUrl: string = getSigninUrl();

  const { authority } = ipLocalStore.value;
  if (typeof authority === "undefined" || authority === "") {
    window.location.assign(signinUrl);
    return;
  }

  switch (authority) {
    case import.meta.env.PUBLIC_MSA_AUTHORITY:
      signinMsa(returnUrl);
      break;
    default:
      window.location.assign(signinUrl);
      break;
  }
};
