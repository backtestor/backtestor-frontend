/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { MapStore, StorageType, defineMapStore } from "@src/services/stores";
import { PkceCodes, StateObject, TokenKeys } from "./types";

export type IpLocalStore = {
  authority: string;
  debugDoNotRedirectOnSignin: boolean;
  debugDoNotRedirectAfterSigninCallback: boolean;
  debugDoNotRedirectAfterSignout: boolean;
};

const initialLocalValue: IpLocalStore = {
  authority: "",
  debugDoNotRedirectOnSignin: false,
  debugDoNotRedirectAfterSigninCallback: false,
  debugDoNotRedirectAfterSignout: false,
};

export type IpSessionStore = {
  scope: string[];
  stateObject: StateObject;
  pkceCodes: PkceCodes;
  tokenKeys: TokenKeys;
};

const initialSessionValue: IpSessionStore = {
  scope: [],
  stateObject: {} as StateObject,
  pkceCodes: {} as PkceCodes,
  tokenKeys: {} as TokenKeys,
};

const prefix = "ip/";

export const ipLocalStore: MapStore<IpLocalStore> = defineMapStore(
  initialLocalValue,
  prefix,
  StorageType.LOCAL_STORAGE,
);

export const ipSessionStore: MapStore<IpSessionStore> = defineMapStore(
  initialSessionValue,
  prefix,
  StorageType.SESSION_STORAGE,
);
