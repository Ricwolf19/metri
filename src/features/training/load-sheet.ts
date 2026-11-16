import type { Equipment } from '@/db/schema';
import { parseDecimal } from '@/lib/numbers';
import type { Units } from '@/lib/storage';

import {
  defaultHands,
  kgToUnit,
  loadModesFor,
  snapPlate,
  type LoadDetail,
  type LoadMode,
} from './load';
import {
  barFor,
  barInUnit,
  barsFor,
  platesForSide,
  platesToSide,
  sideTextFromTotal,
  totalFromSide,
} from './plate-math';

/** The weight sheet's fields, every mode at once, in the DISPLAY unit. */
export type LoadSheetValues = {
  mode: LoadMode;
  // Barbell (and plate-loaded machine)
  barId: string;
  /** ONE side, display unit. */
  plates: number[];
  sledText: string;
  /** A plate machine: two horns (plates ×2) or one post (plates once). */
  sides: 1 | 2;
  // Machine stack
  baseText: string;
  incText: string;
  step: number | null;
  // Dumbbell
  perHandText: string;
  hands: 1 | 2;
  // None
  plainText: string;
};

type SeedInput = {
  unit: Units;
  /** The row's current weight draft (display unit). */
  initialWeight: string;
  /** The row's own detail, else the exercise's last-used config (kg). */
  initialLoad: LoadDetail | null;
  equipment: Equipment | null;
  unilateral: boolean;
  oneDumbbell: boolean;
  preferMode?: LoadMode;
};

/**
 * What the weight sheet opens on: the row's number in every mode at once, so
 * switching modes shows the same weight built another way. Pure, and the
 * sheet's baseline — Apply reports `changed` only when the fields left it.
 */
export const seedLoadSheet = ({
  unit,
  initialWeight,
  initialLoad,
  equipment,
  unilateral,
  oneDumbbell,
  preferMode,
}: SeedInput): LoadSheetValues => {
  // Known equipment locks the mode; a saved detail of another kind (a custom
  // exercise whose equipment changed) yields to it.
  const offered = loadModesFor(equipment, initialLoad);
  const saved = initialLoad?.kind;
  const mode =
    saved && offered.includes(saved)
      ? saved
      : preferMode && offered.includes(preferMode)
        ? preferMode
        : offered[0];
  const row = parseDecimal(initialWeight);

  // Plates: the saved plates when the row still carries them, else the row's
  // total split over the saved (or default) bar onto the rack.
  const plateMachine = equipment === 'machine';
  const bar =
    (initialLoad?.kind === 'barbell' ? barFor(initialLoad.barKg, unit) : null) ?? barsFor(unit)[0];
  const sled = initialLoad?.kind === 'barbell' ? kgToUnit(initialLoad.barKg, unit) : 0;
  const sides = initialLoad?.kind === 'barbell' ? (initialLoad.sides ?? 2) : 2;
  const baseWeight = plateMachine ? sled : barInUnit(bar, unit);
  const savedPlates =
    initialLoad?.kind === 'barbell' ? initialLoad.platesKg.map((p) => snapPlate(p, unit)) : [];
  const savedTotal = totalFromSide(platesToSide(savedPlates), baseWeight, sides);
  const platesMatch = savedPlates.length > 0 && row != null && Math.abs(savedTotal - row) < 0.02;
  const plates = platesMatch
    ? savedPlates
    : (platesForSide(
        parseDecimal(sideTextFromTotal(initialWeight, baseWeight, sides)) ?? 0,
        unit,
      ) ?? []);

  // Stack: the saved base/increment, the row's number on the nearest pin.
  const base = initialLoad?.kind === 'machine' ? kgToUnit(initialLoad.baseKg, unit) : null;
  const inc = initialLoad?.kind === 'machine' ? kgToUnit(initialLoad.incrementKg, unit) : null;
  const pin = base != null && inc != null && inc > 0 && row != null ? (row - base) / inc : null;
  const onPin = pin != null && pin >= 0 && Math.abs(pin - Math.round(pin)) < 0.001;

  return {
    mode,
    barId: bar.id,
    plates,
    sledText: sled > 0 ? String(sled) : '',
    sides,
    baseText: base != null ? String(base) : '',
    incText: inc != null && inc > 0 ? String(inc) : '',
    step: onPin ? Math.round(pin) : null,
    // Dumbbell: the row's number IS one dumbbell.
    perHandText: initialWeight,
    hands: oneDumbbell
      ? 1
      : initialLoad?.kind === 'dumbbell'
        ? initialLoad.hands
        : defaultHands(unilateral),
    plainText: initialWeight,
  };
};
