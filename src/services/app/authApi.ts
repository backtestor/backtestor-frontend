import { AuthApi, defineAuthApi, defineAuthApiOptions } from "@src/services/api/auth";
import { appLoger } from ".";

export const authApi: AuthApi = defineAuthApi(defineAuthApiOptions(appLoger));
