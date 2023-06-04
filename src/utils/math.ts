export const decimalToHex = function decimalToHex(num: number): string {
  let hex: string = num.toString(16);
  while (hex.length < 2) hex = `0${hex}`;

  return hex;
};
