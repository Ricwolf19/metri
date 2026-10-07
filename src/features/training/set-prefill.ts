import type { LoadDetail } from '@/db/schema';
import { kgToLb } from '@/features/bmr/calc';
import type { Units } from '@/lib/storage';

/**
 * The numbers that seed the live set row. These helpers exist so the set-logging
 * path never silently rounds or substitutes what the lifter typed: drafts are
 * strings, bumps keep every decimal the keyboard allows, and only the SEED
 * converts units.
 */

/** Float-error guard for typed decimal arithmetic: 3 decimals covers every
 * real plate/rep increment, and trimming keeps `12.50` from becoming the draft. */
const DECIMALS = 3;

const trimNumber = (n: number): string => String(Number(n.toFixed(DECIMALS)));

/** Exact `current + delta`, clamped at 0, never rounded to a plate increment. */
export const bumpValue = (current: number, delta: number): string => {
  if (!Number.isFinite(current)) return trimNumber(Math.max(0, delta));
  return trimNumber(Math.max(0, current + delta));
};

/**
 * A stored load in the active unit, keeping up to 2 decimals — for the seed AND
 * for every logged value the screen shows (a 0.5 kg collar converts to 1.1 lb;
 * 1-decimal rounding would show 22.75 kg as 22.8 and hand the lifter a
 * different load than they lifted last week).
 */
export const weightText = (kg: number, unit: Units): string =>
  trimNumber(Math.round((unit === 'lb' ? kgToLb(kg) : kg) * 100) / 100);

export type PriorSet = { weightKg: number; reps: number; load?: LoadDetail | null };

/**
 * What the next working-set row starts with. The set just completed wins
 * (same load for the back-off, whatever the plan says); before any set is
 * logged this session the row repeats the NEWEST set of the exercise from any
 * completed session — weight AND reps, what the lifter actually did last time,
 * not last week's top set and the plan's lower bound — then the progression
 * suggestion, then a plain 8-rep row.
 */
export const nextSetPrefill = (input: {
  /** Working (non-warm-up) sets logged this session, in order. */
  logged: PriorSet[];
  /** Planned reps for this row, when the prescription defines them. */
  planReps: number | undefined;
  /** The newest logged working set of this exercise across completed sessions. */
  lastSet: PriorSet | null;
  /** Progression suggestion (kg), when history supports one. */
  suggestedKg: number | null;
}): { weightKg: number | null; reps: number; load: LoadDetail | null } => {
  const { logged, planReps, lastSet, suggestedKg } = input;
  const justDone = logged[logged.length - 1];
  // The detail rides along with the same-session load (same plates for the
  // back-off); a past session's detail is re-derived from the saved config.
  if (justDone)
    return {
      weightKg: justDone.weightKg,
      reps: planReps ?? justDone.reps,
      load: justDone.load ?? null,
    };
  if (lastSet) return { weightKg: lastSet.weightKg, reps: lastSet.reps, load: null };
  return { weightKg: suggestedKg, reps: planReps ?? 8, load: null };
};
