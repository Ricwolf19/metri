import type { Equipment, LoadDetail, SetLog } from '@/db/schema';
import { kgToLb, lbToKg } from '@/features/bmr/calc';
import { trimFloat as trim } from '@/lib/numbers';
import type { Units } from '@/lib/storage';

import { plateOptions, platesForSide } from './plate-math';

export type { LoadDetail };
export type LoadKind = LoadDetail['kind'];
/** A sheet mode: how the load is built, or a plain number. */
export type LoadMode = LoadKind | 'none';

/**
 * How a load is BUILT, separate from the number the lifter names.
 * `set_logs.weight_kg` stays that number — the bar + plates total, the stack,
 * or ONE dumbbell — and the detail is what turns it into a system total for
 * volume (two dumbbells lift twice the number) and into a picture for the
 * sheet (which plates, which pin). Everything here is in kg and pure; the
 * sheet works in the display unit and converts once at Apply.
 */

/** The sheet mode an exercise's equipment opens in; null = plain number. */
export const LOAD_KIND_FOR: Record<Equipment, LoadKind | null> = {
  barbell: 'barbell',
  machine: 'machine',
  cable: 'machine',
  dumbbell: 'dumbbell',
  kettlebell: 'dumbbell',
  bodyweight: null,
  other: null,
};

const EVERY_MODE: LoadMode[] = ['barbell', 'machine', 'dumbbell', 'none'];

/** The bar a barbell exercise is assumed to carry until the sheet says otherwise. */
export const DEFAULT_BAR_KG = 20;

/**
 * A machine is loaded one of three ways and the catalog cannot know which (the
 * same "leg press" is a sled with plates on two horns in one gym, a single
 * post in the next, a pin stack in a third), so the lifter says once per
 * exercise and the choice lives on `exercise_settings.load`: a `barbell`
 * detail with the sled's base as the bar means plates (`sides` 1 = one post,
 * every plate counts once), a `machine` detail means a stack. These seeds are
 * what the chooser writes before any weight is known.
 */
export type MachineKind = 'plates' | 'post' | 'stack';
export const PLATE_MACHINE_SEED: LoadDetail = { kind: 'barbell', barKg: 0, platesKg: [] };
export const POST_MACHINE_SEED: LoadDetail = { kind: 'barbell', barKg: 0, platesKg: [], sides: 1 };
export const STACK_MACHINE_SEED: LoadDetail = {
  kind: 'machine',
  baseKg: 0,
  incrementKg: 0,
  steps: 0,
};

/** How a machine exercise is loaded, read off its saved config; null until chosen. */
export const machineLoadKind = (load: LoadDetail | null | undefined): MachineKind | null =>
  load?.kind === 'barbell'
    ? load.sides === 1
      ? 'post'
      : 'plates'
    : load?.kind === 'machine'
      ? 'stack'
      : null;

/**
 * The modes the sheet may offer for an exercise. Known equipment LOCKS the
 * mode — a bench press cannot be loaded with dumbbells, and a free number on a
 * stack machine only hides what was lifted. A machine offers plates or stack
 * until its kind is chosen (`load` is the exercise's saved config), then locks
 * too; the full choice exists for the unspecified kinds and for custom
 * exercises without equipment.
 */
export const loadModesFor = (
  equipment: Equipment | null | undefined,
  load?: LoadDetail | null,
): LoadMode[] => {
  if (!equipment || equipment === 'other') return EVERY_MODE;
  if (equipment === 'machine') {
    const kind = machineLoadKind(load);
    if (kind === 'plates' || kind === 'post') return ['barbell'];
    if (kind === 'stack') return ['machine'];
    return ['barbell', 'machine'];
  }
  return [LOAD_KIND_FOR[equipment] ?? 'none'];
};

const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

/** The system total a detail describes. */
export const loadTotalKg = (load: LoadDetail): number => {
  switch (load.kind) {
    case 'barbell':
      return trim(load.barKg + (load.sides ?? 2) * sum(load.platesKg));
    case 'machine':
      return trim(load.baseKg + load.steps * load.incrementKg);
    case 'dumbbell':
      return trim(load.perHandKg * load.hands);
  }
};

/** What a logged set actually moved: the detail's total, else the typed number
 * (a pre-upgrade row, or a plain entry). THE definition every volume read uses. */
type LoadedSet = Pick<SetLog, 'weightKg' | 'reps'> & { load?: LoadDetail | null };

const setTotalKg = (set: Omit<LoadedSet, 'reps'>): number =>
  set.load ? loadTotalKg(set.load) : set.weightKg;

export const setVolumeKg = (set: LoadedSet): number => setTotalKg(set) * set.reps;

/** One badge per denomination with a count, largest first — the "20 ×2" model. */
export type PlateStack = { plate: number; count: number };

export const stackPlates = (plates: number[]): PlateStack[] => {
  const counts = new Map<number, number>();
  for (const p of plates) counts.set(p, (counts.get(p) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([plate, count]) => ({ plate, count }));
};

export const unstackPlates = (stack: PlateStack[]): number[] =>
  stack
    .flatMap(({ plate, count }) => Array.from({ length: count }, () => plate))
    .sort((a, b) => b - a);

/** The loads a machine offers, pin by pin, for the badge grid. */
export const machineLoads = (base: number, increment: number, maxSteps = 24): number[] => {
  if (!(increment > 0)) return [];
  return Array.from({ length: maxSteps + 1 }, (_, i) => trim(Math.max(0, base) + i * increment));
};

export const hasLoadDetail = (setting: { load?: LoadDetail | null } | null | undefined): boolean =>
  !!setting?.load;

/** Two dumbbells unless the exercise works one side at a time. */
export const defaultHands = (unilateral: boolean | undefined): 1 | 2 => (unilateral ? 1 : 2);

/* ── Display unit ⇄ kg ──────────────────────────────────────────────────── */

/** A stored kg value as the sheet shows it (2 decimals, like `weightText`). */
export const kgToUnit = (kg: number, unit: Units): number =>
  Math.round((unit === 'lb' ? kgToLb(kg) : kg) * 100) / 100;

export const unitToKg = (value: number, unit: Units): number =>
  unit === 'lb' ? lbToKg(value) : value;

/**
 * A stored kg plate back onto the rack: 45 lb was stored as 20.412 kg and must
 * reopen as the 45 lb badge, not a 45.00 that no option matches. A plate that
 * matches no denomination within 2 % is kept as typed (another gym's rack).
 */
export const snapPlate = (kg: number, unit: Units): number => {
  const shown = kgToUnit(kg, unit);
  const nearest = plateOptions(unit).reduce(
    (best, p) => (Math.abs(p - shown) < Math.abs(best - shown) ? p : best),
    Number.POSITIVE_INFINITY,
  );
  return Math.abs(nearest - shown) <= shown * 0.02 ? nearest : shown;
};

/** Short arithmetic for captions: "20 + 2×(20, 10)", "10 + 6×5", "2 × 30". */
export const describeLoad = (load: LoadDetail, unit: Units): { total: number; parts: string } => {
  const total = kgToUnit(loadTotalKg(load), unit);
  switch (load.kind) {
    case 'barbell': {
      const bar = load.barKg > 0 ? String(kgToUnit(load.barKg, unit)) : '';
      const side = load.platesKg.length
        ? `${load.sides ?? 2}×(${stackPlates(load.platesKg.map((p) => snapPlate(p, unit)))
            .map(({ plate, count }) => (count > 1 ? `${plate}×${count}` : String(plate)))
            .join(', ')})`
        : '';
      return { total, parts: [bar, side].filter(Boolean).join(' + ') };
    }
    case 'machine': {
      const base = load.baseKg > 0 ? String(kgToUnit(load.baseKg, unit)) : '';
      const steps = load.steps > 0 ? `${load.steps}×${kgToUnit(load.incrementKg, unit)}` : '';
      return { total, parts: [base, steps].filter(Boolean).join(' + ') || '0' };
    }
    case 'dumbbell':
      return { total, parts: `${load.hands} × ${kgToUnit(load.perHandKg, unit)}` };
  }
};

/** Tolerance between a draft's total and the row's text, which rounds to 2 decimals. */
const EPS_KG = 0.02;

/** ONE side's plates (display unit) as a detail on `baseKg`; null when no rack adds up to it. */
export const loadFromSide = (
  side: number,
  baseKg: number,
  unit: Units,
  sides: 1 | 2 = 2,
): LoadDetail | null => {
  const plates = platesForSide(side, unit);
  if (!plates) return null;
  return {
    kind: 'barbell',
    barKg: baseKg,
    platesKg: plates.map((p) => unitToKg(p, unit)),
    ...(sides === 1 ? { sides: 1 as const } : {}),
  };
};

/** A stack total back onto its pin; null when it sits between pins or the stack is unconfigured. */
export const machineLoadForTotal = (
  totalKg: number,
  setting: LoadDetail | null | undefined,
): LoadDetail | null => {
  if (setting?.kind !== 'machine' || !(setting.incrementKg > 0)) return null;
  const steps = (totalKg - setting.baseKg) / setting.incrementKg;
  if (steps < -0.01 || Math.abs(steps - Math.round(steps)) > 0.01) return null;
  return { ...setting, steps: Math.max(0, Math.round(steps)) };
};

/**
 * What the live row's number MEANS, decided by the equipment and the saved
 * config. Plate-loaded (a bar, or a machine the lifter marked as plates) takes
 * the weight PER SIDE beside a fixed base — the number a lifter actually
 * handles — and the total is derived; dumbbells take one dumbbell; everything
 * else takes the total. `weight_kg` stores the total in every mode.
 */
export type RowInputMode =
  { mode: 'perSide'; baseKg: number; sides: 1 | 2 } | { mode: 'perHand' } | { mode: 'total' };

/**
 * The heaviest number a field accepts, per mode and unit: past these the
 * plate picture stops meaning anything (a 400-plate side) and the value is a
 * typo. Caps, not validation — the field just stops at the number.
 */
const MAX_INPUT: Record<RowInputMode['mode'], Record<Units, number>> = {
  perSide: { kg: 250, lb: 550 },
  perHand: { kg: 100, lb: 220 },
  total: { kg: 500, lb: 1100 },
};

export const clampInput = (mode: RowInputMode['mode'], value: number, unit: Units): number =>
  Math.min(value, MAX_INPUT[mode][unit]);

export const rowInputMode = (
  facts: { equipment: Equipment | null } | null | undefined,
  setting: LoadDetail | null | undefined,
): RowInputMode => {
  const equipment = facts?.equipment ?? null;
  if (equipment === 'barbell') {
    return {
      mode: 'perSide',
      baseKg: setting?.kind === 'barbell' ? setting.barKg : DEFAULT_BAR_KG,
      sides: 2,
    };
  }
  if (equipment === 'machine' && setting?.kind === 'barbell') {
    return { mode: 'perSide', baseKg: setting.barKg, sides: setting.sides ?? 2 };
  }
  if (equipment === 'dumbbell' || equipment === 'kettlebell') return { mode: 'perHand' };
  return { mode: 'total' };
};

/**
 * The detail a row carries for the number it holds — the one rule for typing
 * AND for the ± buttons, so bumping a bar never drops its plates: per side is
 * split greedily onto the rack, a dumbbell keeps its hands, a stack total lands
 * on its pin. Null when the number names no picture (a side no rack adds up
 * to, a total between pins, a plain number).
 */
export const deriveLoad = (input: {
  mode: RowInputMode;
  /** The row's number in the DISPLAY unit: per side, per hand, or the total. */
  value: number | null;
  unit: Units;
  setting: LoadDetail | null | undefined;
  /** The detail the row already carries (keeps a chosen hand count). */
  current: LoadDetail | null | undefined;
  unilateral: boolean | undefined;
}): LoadDetail | null => {
  const { mode, value, unit, setting, current, unilateral } = input;
  if (value == null) return null;
  switch (mode.mode) {
    case 'perSide':
      return loadFromSide(value, mode.baseKg, unit, mode.sides);
    case 'perHand': {
      const hands =
        current?.kind === 'dumbbell'
          ? current.hands
          : setting?.kind === 'dumbbell'
            ? setting.hands
            : defaultHands(unilateral);
      return { kind: 'dumbbell', perHandKg: unitToKg(value, unit), hands };
    }
    case 'total':
      return machineLoadForTotal(unitToKg(value, unit), setting);
  }
};

/**
 * The detail a set is logged with, reconciled with the number actually typed:
 * - a draft the lifter built in the sheet stands as long as it still adds up to
 *   the row (typing over the total invalidates it — the row is the truth);
 * - no draft, but the exercise is known to be loaded with dumbbells, synthesises
 *   the detail so every dumbbell set carries its ×2 even when the sheet was never
 *   opened — the row's number is one dumbbell, by definition of that equipment;
 * - anything else is a plain number.
 */
export const reconcileLoad = (input: {
  draft: LoadDetail | null | undefined;
  setting: LoadDetail | null | undefined;
  weightKg: number;
  unilateral: boolean | undefined;
}): LoadDetail | null => {
  const { draft, setting, weightKg, unilateral } = input;
  if (draft) {
    if (draft.kind === 'dumbbell') {
      return Math.abs(draft.perHandKg - weightKg) <= EPS_KG
        ? draft
        : { ...draft, perHandKg: weightKg };
    }
    return Math.abs(loadTotalKg(draft) - weightKg) <= EPS_KG ? draft : null;
  }
  if (setting?.kind === 'dumbbell') {
    return { kind: 'dumbbell', perHandKg: weightKg, hands: defaultHands(unilateral) };
  }
  return null;
};
