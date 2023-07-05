/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { MapStore, StorageType, defineMapStore } from "@src/services/stores";

export type LoggerLocalStore = {
  loggerLevel: string;
};

const initialLocalValue: LoggerLocalStore = {
  loggerLevel: "warning",
};

const prefix = "logger/";

export const loggerLocalStore: MapStore<LoggerLocalStore> = defineMapStore(
  initialLocalValue,
  prefix,
  StorageType.LOCAL_STORAGE,
);
