/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { defineMapStore } from "@services/stores/mapStore";
import { AccountEntity } from "./account";

export type AuthStore = {
  interactionStatus?: string;
  accountKeys?: string[];
  accounts?: Record<string, AccountEntity>;
};

const initialValue: AuthStore = {};

const prefix = "auth/";

export const authStore = defineMapStore(initialValue, prefix);
