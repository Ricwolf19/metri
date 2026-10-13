/**
 * Parsing and rounding for every number the lifter types or reads.
 *
 * Inputs are strings in the DISPLAY unit; a Spanish keyboard offers a comma,
 * so `parseDecimal` accepts both separators. Rounding is explicit per caller:
 * `trimFloat` only removes float noise (0.1 + 0.2), `snapTo` is the real
 * rounding rule (a per-side plate weight to 0.25 kg, a displayed total to 0.5).
 */

/** Float-noise guard: 3 decimals covers every real plate/rep increment. */
export const trimFloat = (n: number, decimals = 3): number => Number(n.toFixed(decimals));

/** A typed non-negative number, with `,` accepted as the decimal separator; null otherwise. */
export const parseDecimal = (text: string): number | null => {
  const clean = text.trim().replace(',', '.');
  if (clean === '') return null;
  const n = Number(clean);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/** A typed whole number (reps); `12.5` is rejected, not truncated. */
export const parseInteger = (text: string): number | null => {
  const n = parseDecimal(text);
  return n !== null && Number.isInteger(n) ? n : null;
};

/** Nearest multiple of `step` (0.25, 0.5, 2.5…). */
export const snapTo = (n: number, step: number): number => trimFloat(Math.round(n / step) * step);

/** Training numbers read at .0 / .5 — never body weight, which keeps its decimals. */
export const roundHalf = (n: number): number => snapTo(n, 0.5);

/** A number as the row shows it: noise trimmed, no trailing zeros ("12.50" → "12.5"). */
export const formatNumber = (n: number, maxDecimals = 2): string =>
  String(trimFloat(n, maxDecimals));
