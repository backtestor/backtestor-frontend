import { ServerAuthorizationCodeResponse } from "@src/services/auth/response";
import { queryStringToObject } from "@utils/string";

const parseHash = function parseHash(hashString: string): string {
  const hashIndex1 = hashString.indexOf("#");
  const hashIndex2 = hashString.indexOf("#/");
  if (hashIndex2 > -1) return hashString.substring(hashIndex2 + 2);
  else if (hashIndex1 > -1) return hashString.substring(hashIndex1 + 1);

  return "";
};

export const getDeserializedHash = function getDeserializedHash<T>(hash: string): ServerAuthorizationCodeResponse {
  if (hash.length === 0) return {};

  // Strip the # symbol if present
  const parsedHash = parseHash(hash);

  // If # symbol was not present, above will return empty string, so give original hash value
  const deserializedHash: T = queryStringToObject<T>(parsedHash.length === 0 ? hash : parsedHash);

  // Check if deserialization didn't work
  if (!deserializedHash) throw new Error("Hash was not parsed correctly.", { cause: JSON.stringify(deserializedHash) });

  return deserializedHash;
};
