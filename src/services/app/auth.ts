import { Auth } from "@src/services/auth";
import { defineMsaAuth, defineMsaAuthOptions } from "@src/services/auth/msaAuth";
import { appLoger } from ".";

export const msaAuth: Auth = defineMsaAuth(defineMsaAuthOptions(appLoger));
