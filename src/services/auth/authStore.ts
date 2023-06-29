/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { MapStore, StorageType, defineMapStore } from "@src/services/stores";
import { PkceCodes, StateObject, TokenKeys } from ".";

export type AuthLocalStore = {
  authority: string;
};

const initialLocalValue: AuthLocalStore = {
  authority: "",
};

export type AuthSessionStore = {
  scope: string[];
  stateObject: StateObject;
  pkceCodes: PkceCodes;
  tokenKeys: TokenKeys;
};

const initialSessionValue: AuthSessionStore = {
  scope: [],
  stateObject: {} as StateObject,
  pkceCodes: {} as PkceCodes,
  tokenKeys: {} as TokenKeys,
};

const prefix = "auth/";

export const authLocalStore: MapStore<AuthLocalStore> = defineMapStore(
  initialLocalValue,
  prefix,
  StorageType.LOCAL_STORAGE,
);

export const authSessionStore: MapStore<AuthSessionStore> = defineMapStore(
  initialSessionValue,
  prefix,
  StorageType.SESSION_STORAGE,
);
