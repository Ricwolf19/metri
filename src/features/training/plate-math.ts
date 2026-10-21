import { kgToLb, lbToKg } from '@/features/bmr/calc';
import { trimFloat as trim } from '@/lib/numbers';
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

/**
 * A lb gym's bars ARE 45 / 35 / 25 lb, not a 20 kg bar read as 44.09 lb: with
 * the kg bar every per-side total carried a .09 that the half-rounding of the
 * seed then lost, so the next set reopened on 44.955 a side and re-split the
 * plates. Stored in kg like every load; the sheet labels them in lb.
 */
export const LB_BARS: Bar[] = [
  { id: 'bar-45lb', kg: lbToKg(45) },
  { id: 'bar-35lb', kg: lbToKg(35) },
  { id: 'bar-25lb', kg: lbToKg(25) },
  { id: 'bar-0', kg: 0 },
];

export const barsFor = (unit: Units): Bar[] => (unit === 'lb' ? LB_BARS : BARS);

/** The bar of `unit`'s table a stored detail names, matched to the gram. */
export const barFor = (barKg: number, unit: Units): Bar | null =>
  barsFor(unit).find((b) => Math.abs(b.kg - barKg) < 0.001) ?? null;

/** The plate denominations offered per unit; each can be added several times.
 * lb gyms load lb plates, so converting the kg list (55.12…) offered nothing
 * that exists on the rack. */
const PLATES: Record<Units, number[]> = {
  kg: [25, 20, 15, 10, 5, 2.5, 1.25, 0.5],
  lb: [45, 35, 25, 10, 5, 2.5],
};

/** Total barbell/machine load from ONE side's plates (the other side matches;
 * `sides` 1 is a single post, where the plates count once). */
export const totalFromSide = (side: number, bar: number, sides: 1 | 2 = 2): number =>
  Math.max(0, trim(bar + sides * side));

/** What one side should hold for a target total (for the reverse direction). */
export const sideFromTotal = (total: number, bar: number, sides: 1 | 2 = 2): number =>
  Math.max(0, trim((total - bar) / sides));

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
export const sideTextFromTotal = (totalText: string, bar: number, sides: 1 | 2 = 2): string => {
  const total = Number(totalText);
  if (totalText.trim() === '' || !Number.isFinite(total)) return '';
  if (total <= bar) return '';
  return String(sideFromTotal(total, bar, sides));
};

/** `sideTextFromTotal` for a FIELD: the cent is the most a side ever reads. */
export const sideFieldFromTotal = (totalText: string, bar: number, sides: 1 | 2 = 2): string => {
  const side = sideTextFromTotal(totalText, bar, sides);
  return side ? String(Math.round(Number(side) * 100) / 100) : '';
};

/** The other unit, for the instant equivalent line under the total: takes the
 * value AS DISPLAYED in `unit` and returns it in the other one. */
export const equivalentIn = (displayValue: number, unit: Units): number =>
  Math.round((unit === 'kg' ? kgToLb(displayValue) : lbToKg(displayValue)) * 10) / 10;

/** Bar chip label in the active unit. */
export const barLabel = (bar: Bar, unit: Units): string => String(barInUnit(bar, unit));

/** Plate denominations in the active unit, largest first. */
export const plateOptions = (unit: Units): number[] => PLATES[unit];

/**
 * ONE side's weight split greedily onto the rack, largest first — what the
 * typed per-side number looks like as plates. Null when no combination adds
 * up (1 lb per side on a 2.5-lb rack): the total is still logged, only the
 * picture is missing.
 */
export const platesForSide = (side: number, unit: Units): number[] | null => {
  let left = trim(side);
  if (left < 0) return null;
  const out: number[] = [];
  for (const p of plateOptions(unit)) {
    while (left >= p - 0.0005) {
      out.push(p);
      left = trim(left - p);
    }
  }
  return left > 0.001 ? null : out;
};

/** What the per-side field snaps to: the smallest plate on the rack (1.25 kg,
 * 2.5 lb) halves nothing, so 0.25 kg / 0.5 lb is the finest real step. */
export const sideStep = (unit: Units): number => (unit === 'kg' ? 0.25 : 0.5);

/**
 * Dumbbell racks run in 2.5 kg / 5 lb steps, so the free field gets presets for
 * the common weights. Looked up by the display unit, never converted: a 5 lb
 * step is 2.27 kg and names nothing on a kg rack.
 */
export const DUMBBELL_PRESETS: Record<Units, number[]> = {
  kg: Array.from({ length: 20 }, (_, i) => (i + 1) * 2.5),
  lb: Array.from({ length: 20 }, (_, i) => (i + 1) * 5),
};
