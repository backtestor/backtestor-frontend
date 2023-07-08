import { authSessionStore } from "@src/services/api/authStore";

export const isAuthenticated = function isAuthenticated(): boolean {
  const expiresAtUTC: Date = new Date(authSessionStore.value.token.expiresAtUTC);
  if (isNaN(expiresAtUTC.getTime())) return false;
  const nowUtc = new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate(),
      new Date().getUTCHours(),
      new Date().getUTCMinutes(),
      new Date().getUTCSeconds(),
      new Date().getUTCMilliseconds(),
    ),
  );
  const before: boolean = nowUtc < expiresAtUTC;
  return before;
};
