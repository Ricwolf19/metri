import type { Equipment, LoadDetail, SetLog } from '@/db/schema';
import { kgToLb, lbToKg } from '@/features/bmr/calc';
import type { Units } from '@/lib/storage';

import { plateOptions } from './plate-math';

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

/**
 * The modes the sheet may offer for an exercise. Known equipment LOCKS the
 * mode — a hack squat cannot be loaded with dumbbells, and a free number on a
 * stack machine only hides what was lifted; the choice exists for the
 * unspecified kinds and for custom exercises without equipment.
 */
export const loadModesFor = (equipment: Equipment | null | undefined): LoadMode[] => {
  if (!equipment || equipment === 'other') return EVERY_MODE;
  return [LOAD_KIND_FOR[equipment] ?? 'none'];
};

/** Float-noise guard, same rule as `set-prefill`: 3 decimals covers every real increment. */
const trim = (n: number): number => Number(n.toFixed(3));

const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

/** The system total a detail describes. */
export const loadTotalKg = (load: LoadDetail): number => {
  switch (load.kind) {
    case 'barbell':
      return trim(load.barKg + 2 * sum(load.platesKg));
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
        ? `2×(${stackPlates(load.platesKg.map((p) => snapPlate(p, unit)))
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
