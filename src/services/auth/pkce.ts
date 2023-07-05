import { urlEncodeArr } from "@src/utils/base64";
import { PkceCodes } from "./types";

const RANDOM_BYTE_ARR_LENGTH = 32;
const S256_HASH_ALG = "SHA-256";
const S256_CODE_CHALLENGE_METHOD = "S256";

const generateCodeVerifier = function generateCodeVerifier(): string {
  try {
    // Generate random values as utf-8
    const buffer: Uint8Array = new Uint8Array(RANDOM_BYTE_ARR_LENGTH);
    crypto.getRandomValues(buffer);
    // Encode verifier as base64
    const pkceCodeVerifierB64: string = urlEncodeArr(buffer);
    return pkceCodeVerifierB64;
  } catch (e) {
    throw new Error("Browser crypto or base64 encode/decode function unavailable.");
  }
};

const generateCodeChallengeFromVerifier = async function generateCodeChallengeFromVerifier(
  codeVerifier: string,
  codeChallengeMethod: string,
): Promise<string> {
  try {
    // Hashed verifier
    const encoder = new TextEncoder();
    const data: Uint8Array = encoder.encode(codeVerifier);
    const pkceHashedCodeVerifier: ArrayBuffer = await crypto.subtle.digest({ name: codeChallengeMethod }, data);
    // Encode hash as base64
    return urlEncodeArr(new Uint8Array(pkceHashedCodeVerifier));
  } catch (e) {
    throw new Error("Browser crypto or base64 encode/decode function unavailable.");
  }
};

export const generatePkceCodes = async function generatePkceCodes(): Promise<PkceCodes> {
  const codeVerifier: string = generateCodeVerifier();
  const codeChallenge: string = await generateCodeChallengeFromVerifier(codeVerifier, S256_HASH_ALG);
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: S256_CODE_CHALLENGE_METHOD,
  } as PkceCodes;
};

export const validateCodeChallengeParams = function validateCodeChallengeParams(
  codeChallenge: string,
  codeChallengeMethod: string,
): void {
  if (codeChallenge === "" || codeChallengeMethod === "")
    throw new Error("Please provide both a code challenge and code challenge method.");
  if (codeChallengeMethod !== S256_CODE_CHALLENGE_METHOD) throw new Error("Invalid code challenge method.");
};
