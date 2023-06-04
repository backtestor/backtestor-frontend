/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { defineMapStore } from "@src/services/stores/mapStore";

export type AppStore = {
  jwtToken?: string;
};

const initialValue: AppStore = {};

const prefix = "app/";

export const appStore = defineMapStore(initialValue, prefix);
