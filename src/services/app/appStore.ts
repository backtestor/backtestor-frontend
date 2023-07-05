/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { MapStore, StorageType, defineMapStore } from "@src/services/stores";
import { generateGuid } from "@src/utils/uuid";

export type AppLocalStore = {
  identityProvider: string;
};

const initialLocalValue: AppLocalStore = {
  identityProvider: "",
};

export type AppSessionStore = {
  sessionId: string;
};

const initialSessionValue: AppSessionStore = {
  sessionId: generateGuid(),
};

const prefix = "app/";

export const appLocalStore: MapStore<AppLocalStore> = defineMapStore(
  initialLocalValue,
  prefix,
  StorageType.LOCAL_STORAGE,
);

export const appSessionStore: MapStore<AppSessionStore> = defineMapStore(
  initialSessionValue,
  prefix,
  StorageType.SESSION_STORAGE,
);
