import { Auth } from "@src/services/ip";
import { defineMsaAuth, defineMsaAuthOptions } from "@src/services/ip/msaAuth";
import { appLoger } from "./logger";

export const msaAuth: Auth = defineMsaAuth(defineMsaAuthOptions(appLoger));
