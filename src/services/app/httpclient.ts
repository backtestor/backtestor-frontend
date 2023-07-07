import { Httpclient, defineHttpclient, defineHttpclientOptions } from "@src/services/httpclient";
import { appLoger } from "./logger";

export const httpclient: Httpclient = defineHttpclient(defineHttpclientOptions(appLoger));
