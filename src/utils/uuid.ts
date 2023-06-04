import { decimalToHex } from "@utils/math";

/* eslint-disable no-bitwise */
export const applyVersionAndVariant = function applyVersionAndVariant(buffer: Uint8Array): void {
  /*
   * Buffer[6] and buffer[7] represents the time_hi_and_version field. We will set the four most significant bits (4 through 7) of buffer[6] to represent decimal number 4 (UUID version number).
   * buffer[6] |= 0x40; => Buffer[6] | 01000000 will set the 6 bit to 1.
   * buffer[6] &= 0x4f; => Buffer[6] & 01001111 will set the 4, 5, and 7 bit to 0 such that bits 4-7 == 0100 = "4".
   */
  buffer[6] |= 0x40;
  buffer[6] &= 0x4f;

  /*
   * Buffer[8] represents the clock_seq_hi_and_reserved field. We will set the two most significant bits (6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively.
   * buffer[8] |= 0x80; => Buffer[8] | 10000000 will set the 7 bit to 1.
   * buffer[8] &= 0xbf; => Buffer[8] & 10111111 will set the 6 bit to 0.
   */
  buffer[8] |= 0x80;
  buffer[8] &= 0xbf;
};

const formatGuid = function formatGuid(buffer: Uint8Array): string {
  const hexValues: string[] = Array.from(buffer, decimalToHex);

  return `${hexValues.slice(0, 4).join("")}-${hexValues.slice(4, 6).join("")}-${hexValues
    .slice(6, 8)
    .join("")}-${hexValues.slice(8, 10).join("")}-${hexValues.slice(10).join("")}`;
};

const generateFallbackGuid = function generateFallbackGuid(): string {
  const guidHolder = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  const hex = "0123456789abcdef";
  let r = 0;
  let guidResponse = "";
  for (let i = 0; i < 36; i += 1) {
    if (guidHolder[i] !== "-" && guidHolder[i] !== "4")
      // Each x and y needs to be random
      r = (Math.random() * 16) | 0;

    if (guidHolder[i] === "x") guidResponse += hex[r];
    else if (guidHolder[i] === "y") {
      /*
       * Clock-seq-and-reserved first hex is filtered and remaining hex values are random
       * r &= 0x3; => Bit and with 0011 to set pos 2 to zero ?0??
       * r |= 0x8; => Set pos 3 to 1 as 1???
       */
      r &= 0x3;
      r |= 0x8;
      guidResponse += hex[r];
    } else guidResponse += guidHolder[i];
  }
  return guidResponse;
};

export const generateGuid = function generateGuid(): string {
  try {
    const buffer: Uint8Array = new Uint8Array(16);
    crypto.getRandomValues(buffer);
    applyVersionAndVariant(buffer);
    return formatGuid(buffer);
  } catch (err) {
    return generateFallbackGuid();
  }
};
