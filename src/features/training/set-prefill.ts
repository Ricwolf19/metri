import type { LoadDetail } from '@/db/schema';
import { kgToLb } from '@/features/bmr/calc';
import { formatNumber, roundHalf, snapTo } from '@/lib/numbers';
import type { Units } from '@/lib/storage';

/**
 * The numbers that seed the live set row. These helpers exist so the set-logging
 * path never silently rounds or substitutes what the lifter typed: drafts are
 * strings, a bump keeps the typed value exact to the cent (two decimals, the
 * most any load reads), and only the SEED converts units.
 */

/** `current + delta` to two decimals, clamped at 0, never rounded to a plate increment. */
export const bumpValue = (current: number, delta: number): string => {
  if (!Number.isFinite(current)) return formatNumber(Math.max(0, delta));
  return formatNumber(Math.max(0, current + delta));
};

/**
 * A stored load in the active unit at its smallest step — for the seed AND for
 * every logged value the screen shows: the nearest half in lb (a converted
 * 132.28 lb reads 132.5, the number that goes on the bar, not the arithmetic
 * behind it) and the nearest quarter in kg, because a side snaps to 0.25 kg
 * and a one-post machine with a 1.25 plate totals 21.25, not 21.5.
 */
export const weightText = (kg: number, unit: Units): string =>
  formatNumber(unit === 'lb' ? roundHalf(kgToLb(kg)) : snapTo(kg, 0.25), 2);

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
 * What working-set row `index` starts with. Set 1 opens on set 1 of the
 * previous session of this exercise — weight, reps and plates. Every later
 * set opens on the set JUST LOGGED here: the current session is the source of
 * truth once it has a number (the lifter who added a rep or 2.5 kg keeps it),
 * and the previous session only serves as the reference for the arrows. The
 * reps follow the logged set too, unless the plan steps the reps on this row
 * (a false pyramid 8-6-4), when the plan's number wins. With nothing logged
 * yet past set 1 (every set deleted) history serves as for set 1, then the
 * progression suggestion, then a plain 8-rep row.
 */
export const nextSetPrefill = (input: {
  /** 0-based ordinal of the working set being seeded. */
  index: number;
  /** Planned reps for this row, when the prescription defines them. */
  planReps: number | undefined;
  /** Planned reps of the row before this one; a difference is a pyramid step. */
  prevPlanReps: number | undefined;
  /** Working sets of the previous completed session of this exercise, in order. */
  previous: readonly PriorSet[];
  /** Working (non-warm-up) sets logged this session, in order. */
  logged: readonly PriorSet[];
  /** Progression suggestion (kg), when history supports one. */
  suggestedKg: number | null;
}): { weightKg: number | null; reps: number; load: LoadDetail | null } => {
  const { index, planReps, prevPlanReps, previous, logged, suggestedKg } = input;
  const justDone = logged[logged.length - 1];
  if (index > 0 && justDone) {
    const pyramidStep = planReps != null && planReps !== prevPlanReps;
    return {
      weightKg: justDone.weightKg,
      reps: pyramidStep ? planReps : justDone.reps,
      load: justDone.load ?? null,
    };
  }
  const ref = previousSetFor(previous, index);
  // The previous detail rides along (same plates as last time); `reconcileLoad`
  // still checks it adds up to whatever the row ends up holding.
  if (ref) return { weightKg: ref.weightKg, reps: ref.reps, load: ref.load ?? null };
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
