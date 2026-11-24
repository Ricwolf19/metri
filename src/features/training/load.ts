import type { Equipment, LoadDetail, SetLog } from '@/db/schema';
import { kgToLb, lbToKg } from '@/features/bmr/calc';
import { formatNumber, trimFloat as trim } from '@/lib/numbers';
import type { Units } from '@/lib/storage';

import type { DumbbellRack } from './dumbbell-rack';
import { ladderAt, ladderValues, rungOf, type Ladder } from './ladder';
import { LB_BARS, plateOptions, platesForSide, platesToSide, totalFromSide } from './plate-math';

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

/** The same assumption in a lb gym: a 45 lb bar (`LB_BARS`), never 20 kg read as 44.09 lb. */
export const defaultBarKg = (unit: Units): number =>
  unit === 'lb' ? LB_BARS[0].kg : DEFAULT_BAR_KG;

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

export type StackDetail = Extract<LoadDetail, { kind: 'machine' }>;

/** A stack as a ladder in kg: the base, its plate, and where the plate changes. */
const stackLadderKg = (load: StackDetail): Ladder => ({
  start: load.baseKg,
  step: load.incrementKg,
  jumps: load.jumps?.map((j) => ({ from: j.fromKg, step: j.incrementKg })),
});

/** The same stack in the display unit, as the sheet draws its pins. */
export const stackLadder = (load: StackDetail, unit: Units): Ladder => ({
  start: kgToUnit(load.baseKg, unit),
  step: kgToUnit(load.incrementKg, unit),
  jumps: load.jumps?.map((j) => ({
    from: kgToUnit(j.fromKg, unit),
    step: kgToUnit(j.incrementKg, unit),
  })),
});

/** The most pins a stack offers: past this, a grid of badges stops being a picker. */
export const MAX_PINS = 40;

/**
 * A saved stack's pins in the display unit, pin `i` at index `i`: walked in kg
 * and converted one by one. Walking `stackLadder`'s rounded steps instead (a
 * 5 kg plate is 11.02 lb) drifted a kg stack read in a lb gym off its real
 * totals and past its own plate change, so ± stopped landing on any pin.
 */
export const stackPins = (load: StackDetail, unit: Units): number[] =>
  ladderValues(stackLadderKg(load), unitToKg(inputCap('total', unit), unit), MAX_PINS).map((kg) =>
    kgToUnit(kg, unit),
  );

/** The system total a detail describes. */
export const loadTotalKg = (load: LoadDetail): number => {
  switch (load.kind) {
    case 'barbell':
      return trim(load.barKg + (load.sides ?? 2) * sum(load.platesKg));
    case 'machine':
      return ladderAt(stackLadderKg(load), load.steps);
    case 'dumbbell':
      return trim(load.perHandKg * load.hands);
  }
};

export type PlateSeed = { side: string; weight: string; load: LoadDetail };

/**
 * A per-side row seeded from a logged detail: the SAME plates on this row's
 * base, written as the side and the total in the display unit. Seeding from
 * the stored TOTAL went wrong twice — the half-rounding of the seed (134.09 lb
 * → 134) left a side of 44.955 and dropped the plates, and a one-post 21.25 kg
 * read 21.5 — so the plates are the source and the numbers follow them. A
 * detail on another base keeps its plates too: the lifter put 45s on the bar,
 * whichever bar the row now assumes.
 */
export const seedFromPlates = (
  load: LoadDetail | null | undefined,
  baseKg: number,
  sides: 1 | 2,
  unit: Units,
): PlateSeed | null => {
  if (load?.kind !== 'barbell') return null;
  const side = platesToSide(load.platesKg.map((p) => snapPlate(p, unit)));
  return {
    side: formatNumber(side),
    weight: formatNumber(totalFromSide(side, kgToUnit(baseKg, unit), sides)),
    load: {
      kind: 'barbell',
      barKg: baseKg,
      platesKg: load.platesKg,
      ...(sides === 1 ? { sides: 1 as const } : {}),
    },
  };
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

export const hasLoadDetail = (setting: { load?: LoadDetail | null } | null | undefined): boolean =>
  !!setting?.load;

/**
 * Catalog exercises that hold ONE dumbbell in both hands — the seated French
 * press, the goblet squat, the pullover: the number is the whole load, never
 * ×2. Not `unilateral` (nothing is logged per side); only the hand count.
 */
const ONE_DUMBBELL: ReadonlySet<string> = new Set([
  'overhead-tricep-extension',
  'goblet-squat',
  'pullover',
]);

/**
 * Unilateral catalog lifts done with a dumbbell in EACH hand: one leg works,
 * both dumbbells load it, so the pair counts — a split squat or a lunge is not
 * a single-arm row.
 */
const PAIR_PER_SIDE: ReadonlySet<string> = new Set([
  'bulgarian-split-squat',
  'walking-lunge',
  'reverse-lunge',
]);

/**
 * How many dumbbells a set moves — the EXERCISE's fact, never asked (owner's
 * call 2026-11-24): one for a lift that holds one in both hands, for a
 * kettlebell (a swing, a goblet squat: one bell), and for a unilateral lift
 * other than those done with a pair; else a pair. The row's number is always
 * ONE dumbbell; only volume counts a pair twice.
 */
export const exerciseHands = (exercise: {
  id: string;
  unilateral: boolean;
  equipment: Equipment | null;
}): 1 | 2 => {
  if (ONE_DUMBBELL.has(exercise.id) || exercise.equipment === 'kettlebell') return 1;
  if (exercise.unilateral && !PAIR_PER_SIDE.has(exercise.id)) return 1;
  return 2;
};

/** Whether a logged set moved a PAIR of dumbbells: its number is one of two. */
export const isPair = (load: LoadDetail | null | undefined): boolean =>
  load?.kind === 'dumbbell' && load.hands === 2;

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
      const runs = stackRuns(load).map(({ count, stepKg }) => `${count}×${kgToUnit(stepKg, unit)}`);
      return { total, parts: [base, ...runs].filter(Boolean).join(' + ') || '0' };
    }
    case 'dumbbell':
      return { total, parts: `${load.hands} × ${kgToUnit(load.perHandKg, unit)}` };
  }
};

/**
 * The plates under a stack's pin, grouped by weight: "6 of 5" for a plain
 * stack, "10 of 5, then 2 of 10" past a jump — the arithmetic the caption and
 * the preview spell out.
 */
export const stackRuns = (load: StackDetail): { count: number; stepKg: number }[] => {
  const ladder = stackLadderKg(load);
  const runs: { count: number; stepKg: number }[] = [];
  for (let i = 0; i < load.steps; i++) {
    const stepKg = trim(ladderAt(ladder, i + 1) - ladderAt(ladder, i));
    const last = runs[runs.length - 1];
    if (last && Math.abs(last.stepKg - stepKg) < 0.002) last.count += 1;
    else runs.push({ count: 1, stepKg });
  }
  return runs;
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
  if (!setting.jumps?.length) {
    const steps = (totalKg - setting.baseKg) / setting.incrementKg;
    if (steps < -0.01 || Math.abs(steps - Math.round(steps)) > 0.01) return null;
    return { ...setting, steps: Math.max(0, Math.round(steps)) };
  }
  const steps = rungOf(ladderValues(stackLadderKg(setting), totalKg + 0.01, 10_000), totalKg);
  return steps == null ? null : { ...setting, steps };
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

/** The heaviest a mode offers: the top of a dumbbell rack, the last pin of a stack. */
export const inputCap = (mode: RowInputMode['mode'], unit: Units): number => MAX_INPUT[mode][unit];

/**
 * Every dumbbell on a rack (display unit), lightest first, up to the heaviest a
 * gym holds: the ladder's rungs and the odd ones the lifter added beside them
 * (a 12 lb on a rack that goes up by 5), merged in order. An extra the ladder
 * already reaches is not listed twice. THE list the grid draws, `rungOf`
 * finds a pick in and the row's ± walks (`stepAlong`).
 */
export const rackWeights = (rack: DumbbellRack, unit: Units): number[] => {
  const cap = inputCap('perHand', unit);
  const rungs = ladderValues(rack, cap, 80);
  const odd = (rack.extras ?? []).filter((w) => w > 0 && w <= cap && rungOf(rungs, w) == null);
  return odd.length ? [...rungs, ...odd].sort((a, b) => a - b) : rungs;
};

export const rowInputMode = (
  facts: { equipment: Equipment | null } | null | undefined,
  setting: LoadDetail | null | undefined,
  unit: Units,
): RowInputMode => {
  const equipment = facts?.equipment ?? null;
  if (equipment === 'barbell') {
    return {
      mode: 'perSide',
      baseKg: setting?.kind === 'barbell' ? setting.barKg : defaultBarKg(unit),
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
 * split greedily onto the rack, a dumbbell is one dumbbell counted by the
 * exercise's hands (`exerciseHands` — never a count the row or a saved detail
 * chose), a stack total lands on its pin. Null when the number names no
 * picture (a side no rack adds up to, a total between pins, a plain number).
 */
export const deriveLoad = (input: {
  mode: RowInputMode;
  /** The row's number in the DISPLAY unit: per side, per hand, or the total. */
  value: number | null;
  unit: Units;
  setting: LoadDetail | null | undefined;
  /** How many dumbbells a set moves (`exerciseHands`). */
  hands: 1 | 2;
}): LoadDetail | null => {
  const { mode, value, unit, setting, hands } = input;
  if (value == null) return null;
  switch (mode.mode) {
    case 'perSide':
      return loadFromSide(value, mode.baseKg, unit, mode.sides);
    case 'perHand':
      return { kind: 'dumbbell', perHandKg: unitToKg(value, unit), hands };
    case 'total':
      return machineLoadForTotal(unitToKg(value, unit), setting);
  }
};

/**
 * The detail a set is logged with, reconciled with the number actually typed:
 * - a draft the lifter built in the sheet stands as long as it still adds up to
 *   the row (typing over the total invalidates it — the row is the truth);
 * - a dumbbell, drafted or not (the exercise is known to be loaded with them),
 *   is the row's number as ONE dumbbell counted by the exercise's hands — so
 *   every dumbbell set carries its ×2 even when the sheet was never opened, and
 *   no count a draft or an older build picked outlives the rule;
 * - anything else is a plain number.
 */
export const reconcileLoad = (input: {
  draft: LoadDetail | null | undefined;
  setting: LoadDetail | null | undefined;
  weightKg: number;
  /** How many dumbbells a set moves (`exerciseHands`). */
  hands: 1 | 2;
}): LoadDetail | null => {
  const { draft, setting, weightKg, hands } = input;
  if (draft?.kind === 'dumbbell' || (!draft && setting?.kind === 'dumbbell')) {
    return { kind: 'dumbbell', perHandKg: weightKg, hands };
  }
  if (draft) return Math.abs(loadTotalKg(draft) - weightKg) <= EPS_KG ? draft : null;
  return null;
};
