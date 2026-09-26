import { kgToLb, lbToKg } from '@/features/bmr/calc';
import type { Units } from '@/lib/storage';

/**
 * Pure arithmetic for the quick total-weight calculator (backlog B1/B3):
 * plate-loaded bars and machines where the lifter loads one side and the other
 * matches. Everything is computed in kg (the stored unit) and only rendered in
 * the active display unit.
 */

export type Bar = { id: string; kg: number };

/** Standard bars; `kg: 0` is the plate-loaded machine / Smith-with-counterweight case. */
export const BARS: Bar[] = [
  { id: 'bar-20', kg: 20 },
  { id: 'bar-15', kg: 15 },
  { id: 'bar-10', kg: 10 },
  { id: 'bar-0', kg: 0 },
];

/** The plate denominations offered, in kg; each can be added several times. */
const PLATES_KG: number[] = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5];

/** Total barbell/machine load from ONE side's plates (the other side matches). */
export const totalFromSide = (sideKg: number, barKg: number): number =>
  Math.max(0, barKg + 2 * sideKg);

/** What one side should hold for a target total (for the reverse direction). */
export const sideFromTotal = (totalKg: number, barKg: number): number =>
  Math.max(0, (totalKg - barKg) / 2);

export const platesToSide = (platesKg: number[]): number => platesKg.reduce((sum, p) => sum + p, 0);

/**
 * The per-side field's starting text when the calculator opens on a row that
 * already holds a TOTAL: seeding the field with the total itself made the sheet
 * double it (plus the bar) the moment it opened. Empty when there is nothing
 * sensible to split (no number, or less than the bar).
 */
export const sideTextFromTotal = (totalText: string, barKg: number, unit: Units): string => {
  const total = Number(totalText);
  if (totalText.trim() === '' || !Number.isFinite(total)) return '';
  const totalKg = fromDisplay(total, unit);
  if (totalKg <= barKg) return '';
  return String(toDisplay(sideFromTotal(totalKg, barKg), unit));
};

/** Display-unit conversion that keeps plate-friendly precision (2 decimals). */
export const toDisplay = (kg: number, unit: Units): number =>
  Math.round((unit === 'lb' ? kgToLb(kg) : kg) * 100) / 100;

export const fromDisplay = (value: number, unit: Units): number =>
  unit === 'lb' ? lbToKg(value) : value;

/** The other unit, for the instant equivalent line under the total: takes the
 * value AS DISPLAYED in `unit` and returns it in the other one. */
export const equivalentIn = (displayValue: number, unit: Units): number =>
  Math.round((unit === 'kg' ? kgToLb(displayValue) : lbToKg(displayValue)) * 10) / 10;

/** Bar list rendered in the active unit (20 kg ≈ 44.1 lb — collars are metric). */
export const barLabel = (bar: Bar, unit: Units): string =>
  bar.kg === 0 ? '0' : String(toDisplay(bar.kg, unit));

/** Plate denominations in the active unit, largest first. */
export const plateOptions = (unit: Units): number[] => PLATES_KG.map((p) => toDisplay(p, unit));
