import { defineMsaAuth, defineMsaAuthOptions } from "@src/services/auth/msaAuth";
import { Auth } from "@src/services/auth/types";
import { appLoger } from "./logger";

export const msaAuth: Auth = defineMsaAuth(defineMsaAuthOptions(appLoger));
