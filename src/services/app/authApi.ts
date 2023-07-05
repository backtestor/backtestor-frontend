import { AuthApi, defineAuthApi, defineAuthApiOptions } from "@src/services/api/auth";
import { appLoger } from "./logger";

export const authApi: AuthApi = defineAuthApi(defineAuthApiOptions(appLoger));
