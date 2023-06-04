import { urlEncodeArr } from "./base64";

export interface PkceCodes {
  verifier: string;
  challenge: string;
}

const RANDOM_BYTE_ARR_LENGTH = 32;

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
  verifier: string,
): Promise<string> {
  const S256_HASH_ALG = "SHA-256";
  try {
    // Hashed verifier
    const encoder = new TextEncoder();
    const data: Uint8Array = encoder.encode(verifier);
    const pkceHashedCodeVerifier = await crypto.subtle.digest({ name: S256_HASH_ALG }, data);
    // Encode hash as base64
    return urlEncodeArr(new Uint8Array(pkceHashedCodeVerifier));
  } catch (e) {
    throw new Error("Browser crypto or base64 encode/decode function unavailable.");
  }
};

export interface PkceCodesResult {
  verifier: string;
  challenge: string;
}

export const generatePkceCodes = async function generatePkceCodes(): Promise<PkceCodesResult> {
  const verifier: string = generateCodeVerifier();
  const challenge: string = await generateCodeChallengeFromVerifier(verifier);
  return {
    verifier,
    challenge,
  };
};
