/* eslint-disable no-mixed-operators */

/* eslint-disable no-nested-ternary */
/* eslint-disable no-bitwise */
/* eslint-disable no-plusplus */

/**
 * Utility functions for strings in a browser to encode plaintext to base64 encoded string or to decode base64 strings to plaintext.
 * See here for implementation details:
 * https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_2_%E2%80%93_JavaScript's_UTF-16_%3E_UTF-8_%3E_base64
 */

/**
 * Base64 string to array encoding helper
 * @param nUint6
 */
const uint6ToB64 = function uint6ToB64(nUint6: number): number {
  return nUint6 < 26
    ? nUint6 + 65
    : nUint6 < 52
    ? nUint6 + 71
    : nUint6 < 62
    ? nUint6 - 4
    : nUint6 === 62
    ? 43
    : nUint6 === 63
    ? 47
    : 65;
};

/**
 * Base64 encode byte array
 * @param aBytes
 */
const base64EncArr = function base64EncArr(aBytes: Uint8Array): string {
  const eqLen = (3 - (aBytes.length % 3)) % 3;
  let sB64Enc = "";

  for (let nIdx = 0; nIdx < aBytes.length; nIdx += 3) {
    const nPart1 = aBytes[nIdx] ?? 0;
    const nPart2 = aBytes[nIdx + 1] ?? 0;
    const nPart3 = aBytes[nIdx + 2] ?? 0;

    const nUint24 = (nPart1 << 16) | (nPart2 << 8) | nPart3;

    sB64Enc += String.fromCharCode(
      uint6ToB64((nUint24 >>> 18) & 63),
      uint6ToB64((nUint24 >>> 12) & 63),
      uint6ToB64((nUint24 >>> 6) & 63),
      uint6ToB64(nUint24 & 63),
    );
  }

  return eqLen === 0 ? sB64Enc : sB64Enc.substring(0, sB64Enc.length - eqLen) + (eqLen === 1 ? "=" : "==");
};

/**
 * Returns b64 encoded string from plaintext string.
 * @param input
 */
export const encode = function encode(input: string): string {
  const encoder = new TextEncoder();
  const inputUtf8Arr: Uint8Array = encoder.encode(input);
  return base64EncArr(inputUtf8Arr);
};

/**
 * Returns URL Safe b64 encoded string from a plaintext string.
 * @param input
 */
export const urlEncode = function urlEncode(input: string): string {
  return encodeURIComponent(encode(input).replace(/[=]/gu, "").replace(/\+/gu, "-").replace(/\//gu, "_"));
};

/**
 * Returns URL Safe b64 encoded string from an int8Array.
 * @param inputArr
 */
export const urlEncodeArr = function urlEncodeArr(inputArr: Uint8Array): string {
  return base64EncArr(inputArr).replace(/[=]/gu, "").replace(/\+/gu, "-").replace(/\//gu, "_");
};

/**
 * Base64 string to array decoding helper
 * @param charNum
 */
const b64ToUint6 = function b64ToUint6(charNum: number): number {
  return charNum > 64 && charNum < 91
    ? charNum - 65
    : charNum > 96 && charNum < 123
    ? charNum - 71
    : charNum > 47 && charNum < 58
    ? charNum + 4
    : charNum === 43
    ? 62
    : charNum === 47
    ? 63
    : 0;
};

/**
 * Decodes base64 into Uint8Array
 * @param base64String
 * @param nBlockSize
 */
const base64DecToArr = function base64DecToArr(base64String: string, nBlockSize?: number): Uint8Array {
  const sB64Enc = base64String.replace(/[^A-Za-z0-9+/]/gu, "");
  const nInLen = sB64Enc.length;
  const nOutLen = nBlockSize ? Math.ceil(((nInLen * 3 + 1) >>> 2) / nBlockSize) * nBlockSize : (nInLen * 3 + 1) >>> 2;
  const aBytes = new Uint8Array(nOutLen);

  for (let nInIdx = 0, nMod3, nMod4, nOutIdx = 0, nUint24 = 0; nInIdx < nInLen; nInIdx++) {
    nMod4 = nInIdx & 3;
    nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << (18 - 6 * nMod4);
    if (nMod4 === 3 || nInLen - nInIdx === 1) {
      for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++)
        aBytes[nOutIdx] = (nUint24 >>> ((16 >>> nMod3) & 24)) & 255;

      nUint24 = 0;
    }
  }

  return aBytes;
};

/**
 * Returns a URL-safe plaintext decoded string from b64 encoded input.
 * @param input
 */
export const decode = function decode(input: string): string {
  let encodedString = input.replace(/-/gu, "+").replace(/_/gu, "/");
  switch (encodedString.length % 4) {
    case 0:
      break;
    case 2:
      encodedString += "==";
      break;
    case 3:
      encodedString += "=";
      break;
    default:
      throw new Error("Invalid base64 string");
  }

  const inputUtf8Arr = base64DecToArr(encodedString);
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(inputUtf8Arr);
};
