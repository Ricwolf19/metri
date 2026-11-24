import type { Equipment } from '@/db/schema';
import { parseDecimal } from '@/lib/numbers';
import type { Units } from '@/lib/storage';

import { ladderValues, rungOf, type Ladder, type StepJump } from './ladder';
import {
  inputCap,
  kgToUnit,
  loadModesFor,
  MAX_PINS,
  snapPlate,
  stackLadder,
  stackPins,
  type LoadDetail,
  type LoadMode,
  type StackDetail,
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

/** A step change as typed: "from 50, every 10" (display unit). */
export type JumpText = { fromText: string; stepText: string };

const jumpsToText = (jumps: readonly StepJump[] | undefined): JumpText[] =>
  (jumps ?? []).map((j) => ({ fromText: String(j.from), stepText: String(j.step) }));

/** The typed step changes that say something; a half-typed row is skipped. */
export const parseJumpTexts = (texts: readonly JumpText[]): StepJump[] =>
  texts.flatMap((j) => {
    const from = parseDecimal(j.fromText);
    const step = parseDecimal(j.stepText);
    return from != null && step != null && step > 0 ? [{ from, step }] : [];
  });

type StackFields = Pick<LoadSheetValues, 'baseText' | 'incText' | 'jumps'>;

/**
 * The saved stack while the sheet's stack fields still read as it (`opened` is
 * what they were seeded with): its kg values stand. In the other unit those
 * fields show rounded numbers (a 5 kg plate reads 11.02 lb), and walking or
 * saving them drifted the pins off the real totals and moved the plate change.
 */
export const untouchedStack = (
  values: StackFields,
  opened: StackFields,
  saved: LoadDetail | null | undefined,
): StackDetail | null =>
  saved?.kind === 'machine' &&
  values.baseText === opened.baseText &&
  values.incText === opened.incText &&
  JSON.stringify(values.jumps) === JSON.stringify(opened.jumps)
    ? saved
    : null;

/** The pins the sheet's stack offers (display unit): the saved stack's own, else as typed. */
export const sheetPins = (
  values: StackFields,
  unit: Units,
  saved: StackDetail | null = null,
): number[] =>
  saved
    ? stackPins(saved, unit)
    : ladderValues(
        {
          start: parseDecimal(values.baseText) ?? 0,
          step: parseDecimal(values.incText) ?? 0,
          jumps: parseJumpTexts(values.jumps),
        },
        inputCap('total', unit),
        MAX_PINS,
      );

/** The dumbbell rack as typed in the sheet (display unit); step 0 while half typed. */
export const sheetRack = (
  values: Pick<LoadSheetValues, 'rackStartText' | 'rackStepText' | 'rackJumps'>,
): Ladder => ({
  start: parseDecimal(values.rackStartText) ?? 0,
  step: parseDecimal(values.rackStepText) ?? 0,
  jumps: parseJumpTexts(values.rackJumps),
});

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
  /** Where the plates change weight further down the stack. */
  jumps: JumpText[];
  step: number | null;
  // Dumbbell: ONE dumbbell, always — how many the set moves is the exercise's
  // (`defaultHands`), never a field.
  perHandText: string;
  /** The gym's rack (a device setting), editable from here. */
  rackStartText: string;
  rackStepText: string;
  rackJumps: JumpText[];
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
  preferMode?: LoadMode;
  /** The dumbbell rack's ladder in the display unit (`dumbbellRack`). */
  rack: Ladder;
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
  preferMode,
  rack,
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

  // Stack: the saved base/increment and step changes, the row's number on its
  // pin — found among the saved stack's own pins, not the rounded fields'.
  const savedStack = initialLoad?.kind === 'machine' ? initialLoad : null;
  const stack = savedStack ? stackLadder(savedStack, unit) : null;

  return {
    mode,
    barId: bar.id,
    plates,
    sledText: sled > 0 ? String(sled) : '',
    sides,
    baseText: stack ? String(stack.start) : '',
    incText: stack && stack.step > 0 ? String(stack.step) : '',
    jumps: jumpsToText(stack?.jumps),
    step: savedStack ? rungOf(stackPins(savedStack, unit), row) : null,
    // Dumbbell: the row's number IS one dumbbell.
    perHandText: initialWeight,
    rackStartText: String(rack.start),
    rackStepText: String(rack.step),
    rackJumps: jumpsToText(rack.jumps),
    plainText: initialWeight,
  };
};
