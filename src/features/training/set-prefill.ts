import type { LoadDetail } from '@/db/schema';
import { kgToLb } from '@/features/bmr/calc';
import { formatNumber, roundHalf } from '@/lib/numbers';
import type { Units } from '@/lib/storage';

/**
 * The numbers that seed the live set row. These helpers exist so the set-logging
 * path never silently rounds or substitutes what the lifter typed: drafts are
 * strings, bumps keep every decimal the keyboard allows, and only the SEED
 * converts units.
 */

/** Exact `current + delta`, clamped at 0, never rounded to a plate increment. */
export const bumpValue = (current: number, delta: number): string => {
  if (!Number.isFinite(current)) return formatNumber(Math.max(0, delta), 3);
  return formatNumber(Math.max(0, current + delta), 3);
};

/**
 * A stored load in the active unit at the nearest half — for the seed AND for
 * every logged value the screen shows. Loads are entered in halves and
 * quarters, so a converted 132.28 lb reads 132.5: the number the lifter can
 * actually put on the bar, not the arithmetic behind it.
 */
export const weightText = (kg: number, unit: Units): string =>
  formatNumber(roundHalf(unit === 'lb' ? kgToLb(kg) : kg), 2);

export type PriorSet = { weightKg: number; reps: number; load?: LoadDetail | null };

/**
 * The set of the previous session that set `index` is measured against: the
 * same ordinal, or the previous session's last set once this one runs longer.
 * `previous` holds WORKING sets only, in order — `set_logs.set_number` counts
 * warm-ups too, so callers filter before indexing.
 */
export const previousSetFor = <T extends PriorSet>(
  previous: readonly T[],
  index: number,
): T | null => previous[index] ?? previous[previous.length - 1] ?? null;

/**
 * What working-set row `index` starts with. The SAME set of the previous
 * session of this exercise wins — weight AND reps, what the lifter did on set
 * 3 last time, not the heaviest set and not the set just finished: a lifter
 * whose weight drops across sets saw every row open at the top-set load.
 * Beyond the previous session's count its last set repeats. With no history
 * the set just completed seeds the next one (same load for the back-off),
 * then the progression suggestion, then a plain 8-rep row.
 */
export const nextSetPrefill = (input: {
  /** 0-based ordinal of the working set being seeded. */
  index: number;
  /** Planned reps for this row, when the prescription defines them. */
  planReps: number | undefined;
  /** Working sets of the previous completed session of this exercise, in order. */
  previous: readonly PriorSet[];
  /** Working (non-warm-up) sets logged this session, in order. */
  logged: readonly PriorSet[];
  /** Progression suggestion (kg), when history supports one. */
  suggestedKg: number | null;
}): { weightKg: number | null; reps: number; load: LoadDetail | null } => {
  const { index, planReps, previous, logged, suggestedKg } = input;
  const ref = previousSetFor(previous, index);
  // The previous detail rides along (same plates as last time); `reconcileLoad`
  // still checks it adds up to whatever the row ends up holding.
  if (ref) return { weightKg: ref.weightKg, reps: ref.reps, load: ref.load ?? null };
  const justDone = logged[logged.length - 1];
  if (justDone)
    return {
      weightKg: justDone.weightKg,
      reps: planReps ?? justDone.reps,
      load: justDone.load ?? null,
    };
  return { weightKg: suggestedKg, reps: planReps ?? 8, load: null };
};

export type Trend = 'up' | 'down' | 'same';

/** How a typed value compares with its reference; null when either is missing. */
export const compareToPrevious = (
  current: number | null,
  previous: number | null,
  eps = 0,
): Trend | null => {
  if (current == null || previous == null) return null;
  const delta = current - previous;
  if (Math.abs(delta) <= eps) return 'same';
  return delta > 0 ? 'up' : 'down';
};
