import { getLanguageFromPath } from "@src/i18n";
import { Auth, defineAuthCodeRequest } from "@src/services/ip";
import { ipLocalStore } from "@src/services/ip/ipStore";
import { defineMsaAuth, defineMsaAuthOptions } from "@src/services/ip/msaAuth";
import { OIDC_SCOPES } from "@src/services/ip/types";
import { appSessionStore } from "./appStore";
import { appLoger } from "./logger";

const getSigninUrl = function getSigninUrl(): string {
  const { pathname } = window.location;
  const lang: string | null = getLanguageFromPath(pathname);
  const signinUrl = `${lang ? `/${lang}` : ""}/signin`;
  return signinUrl;
};

export const msaAuth: Auth = defineMsaAuth(defineMsaAuthOptions(appLoger));

export const signinMsa = function signinMsa(returnUrl: string): void {
  msaAuth.getAuthCode(defineAuthCodeRequest(returnUrl, OIDC_SCOPES, appSessionStore.value.sessionId));
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
