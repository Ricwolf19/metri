import { kgToLb, lbToKg } from '@/features/bmr/calc';
import type { Units } from '@/lib/storage';

/**
 * Pure arithmetic for the quick total-weight calculator (backlog B1/B3):
 * plate-loaded bars and machines where the lifter loads one side and the other
 * matches. The sheet works in the DISPLAY unit end to end — converting every
 * total through kg and back rounded 22.75 kg to 22.76 and 225 lb to 224.99 on
 * an untouched open → Apply, a silent change in the set-logging path.
 */

export type Bar = { id: string; kg: number };

/** Standard bars; `kg: 0` is the plate-loaded machine / Smith-with-counterweight case. */
export const BARS: Bar[] = [
  { id: 'bar-20', kg: 20 },
  { id: 'bar-15', kg: 15 },
  { id: 'bar-10', kg: 10 },
  { id: 'bar-0', kg: 0 },
];

/** The plate denominations offered per unit; each can be added several times.
 * lb gyms load lb plates, so converting the kg list (55.12…) offered nothing
 * that exists on the rack. */
const PLATES: Record<Units, number[]> = {
  kg: [25, 20, 15, 10, 5, 2.5, 1.25, 0.5],
  lb: [45, 35, 25, 10, 5, 2.5],
};

/** Float-noise guard, same rule as `set-prefill`: 3 decimals covers every real
 * plate increment, and a halved 0.25 step (0.125) still fits exactly. */
const trim = (n: number): number => Number(n.toFixed(3));

/** Total barbell/machine load from ONE side's plates (the other side matches). */
export const totalFromSide = (side: number, bar: number): number =>
  Math.max(0, trim(bar + 2 * side));

/** What one side should hold for a target total (for the reverse direction). */
export const sideFromTotal = (total: number, bar: number): number =>
  Math.max(0, trim((total - bar) / 2));

export const platesToSide = (plates: number[]): number =>
  trim(plates.reduce((sum, p) => sum + p, 0));

/** One more plate of `p` on the side, kept largest-first (the loading order). */
export const addPlate = (plates: number[], p: number): number[] =>
  [...plates, p].sort((a, b) => b - a);

/** Takes ONE plate of `p` off — the side may hold several of the same size. */
export const removePlate = (plates: number[], p: number): number[] => {
  const i = plates.indexOf(p);
  return i < 0 ? plates : plates.filter((_, idx) => idx !== i);
};

/**
 * A bar's weight in the active unit, as its chip shows it (20 kg = 44.09 lb —
 * collars are metric). The arithmetic uses this same number, not the unrounded
 * conversion: with 44.0924… a 3-decimal side could never add back to a round
 * lb total, and every figure on the sheet must add up to the one applied.
 */
export const barInUnit = (bar: Bar, unit: Units): number =>
  unit === 'lb' ? Math.round(kgToLb(bar.kg) * 100) / 100 : bar.kg;

/**
 * The per-side field's starting text when the calculator opens on a row that
 * already holds a TOTAL: seeding the field with the total itself made the sheet
 * double it (plus the bar) the moment it opened. Empty when there is nothing
 * sensible to split (no number, or less than the bar). Both numbers are in the
 * display unit, so `totalFromSide` on the result gives back `totalText` exactly.
 */
export const sideTextFromTotal = (totalText: string, bar: number): string => {
  const total = Number(totalText);
  if (totalText.trim() === '' || !Number.isFinite(total)) return '';
  if (total <= bar) return '';
  return String(sideFromTotal(total, bar));
};

/** The other unit, for the instant equivalent line under the total: takes the
 * value AS DISPLAYED in `unit` and returns it in the other one. */
export const equivalentIn = (displayValue: number, unit: Units): number =>
  Math.round((unit === 'kg' ? kgToLb(displayValue) : lbToKg(displayValue)) * 10) / 10;

/** Bar chip label in the active unit. */
export const barLabel = (bar: Bar, unit: Units): string => String(barInUnit(bar, unit));

/** Plate denominations in the active unit, largest first. */
export const plateOptions = (unit: Units): number[] => PLATES[unit];
