/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { defineMapStore } from "@src/services/stores";

export type AppStore = {
  jwtToken?: string | undefined;
};

const initialValue: AppStore = {
  jwtToken: undefined,
};

const prefix = "app/";

export const appStore = defineMapStore(initialValue, prefix);
