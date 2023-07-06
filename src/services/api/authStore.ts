/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { MapStore, StorageType, defineMapStore } from "@src/services/stores";
import { TokenApiResponse } from "./auth";

export type AuthSessionStore = {
  token: TokenApiResponse;
};

const initialSessionValue: AuthSessionStore = {
  token: {} as TokenApiResponse,
};

const prefix = "auth/";

export const authSessionStore: MapStore<AuthSessionStore> = defineMapStore(
  initialSessionValue,
  prefix,
  StorageType.SESSION_STORAGE,
);
