/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { MapStore, StorageType, defineMapStore } from "@src/services/stores";
import { generateGuid } from "@src/utils/uuid";

export type AppSessionStore = {
  sessionId: string;
};

const initialSessionValue: AppSessionStore = {
  sessionId: generateGuid(),
};

const prefix = "app/";

export const appSessionStore: MapStore<AppSessionStore> = defineMapStore(
  initialSessionValue,
  prefix,
  StorageType.SESSION_STORAGE,
);
