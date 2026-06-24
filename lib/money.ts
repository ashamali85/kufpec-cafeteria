/**
 * All money is stored as integer fils to avoid floating-point drift.
 * 1 KWD = 1000 fils. Kuwait conventionally shows 3 decimal places.
 */
export const FILS_PER_KWD = 1000;

/** Format fils as a KWD string, e.g. 1500 -> "1.500 KWD". */
export function formatKwd(fils: number): string {
  const sign = fils < 0 ? '-' : '';
  const abs = Math.abs(fils);
  const kwd = Math.floor(abs / FILS_PER_KWD);
  const rem = abs % FILS_PER_KWD;
  return `${sign}${kwd}.${rem.toString().padStart(3, '0')} KWD`;
}

/** Parse a user-entered KWD string (e.g. "1.5", "2.750") into integer fils. */
export function parseKwdToFils(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d+(\.\d{1,3})?$/.test(trimmed)) return null;
  const [whole, frac = ''] = trimmed.split('.');
  const fils = parseInt(whole, 10) * FILS_PER_KWD + parseInt(frac.padEnd(3, '0'), 10);
  return Number.isFinite(fils) ? fils : null;
}
