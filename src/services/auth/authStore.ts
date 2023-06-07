/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { defineMapStore } from "@services/stores/mapStore";
import { PkceCodes, StateObject } from "./request";

export type AuthStore = {
  scope: string[];
  stateObject: StateObject;
  pkceCodes: PkceCodes;
};

const initialValue: AuthStore = {
  scope: [],
  stateObject: {} as StateObject,
  pkceCodes: {} as PkceCodes,
};

const prefix = "auth/";

export const authStore = defineMapStore(initialValue, prefix);
