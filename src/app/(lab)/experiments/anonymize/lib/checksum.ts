/**
 * Checksum validators used to cut down false positives on number-shaped
 * matches (a bare 9-digit number is not necessarily a BSN). Each returns
 * false on malformed input rather than throwing, so detectors can call them
 * directly on regex captures.
 */

/** Dutch BSN "elfproef" (eleven test). */
export function isValidBsn(digits: string): boolean {
  if (!/^\d{9}$/.test(digits)) return false;
  const d = digits.split("").map(Number);
  const sum =
    d[0] * 9 + d[1] * 8 + d[2] * 7 + d[3] * 6 + d[4] * 5 + d[5] * 4 + d[6] * 3 + d[7] * 2 + d[8] * -1;
  return sum !== 0 && sum % 11 === 0;
}

/** Luhn check, used for credit card numbers. Input: digits only, no separators. */
export function isValidLuhn(digits: string): boolean {
  if (!/^\d{12,19}$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

/** IBAN mod-97 checksum (ISO 7064). Input: uppercase, no spaces. */
export function isValidIban(iban: string): boolean {
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const value = ch >= "A" && ch <= "Z" ? ch.charCodeAt(0) - 55 : Number(ch);
    // A multi-digit letter value needs to be folded in digit-by-digit.
    for (const digitChar of String(value)) {
      remainder = (remainder * 10 + Number(digitChar)) % 97;
    }
  }
  return remainder === 1;
}
