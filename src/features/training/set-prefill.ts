import { kgToLb } from '@/features/bmr/calc';
import type { Units } from '@/lib/storage';

/**
 * The numbers that seed the live set row. These helpers exist so the set-logging
 * path never silently rounds or substitutes what the lifter typed (field bugs
 * A2/A3 in docs/test-feedback-backlog.md): drafts are strings, bumps keep every
 * decimal the keyboard allows, and only the SEED converts units.
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

export type PriorSet = { weightKg: number; reps: number };

/**
 * What the next working-set row starts with. The set just completed wins
 * (same load for the back-off, whatever the plan said last week); before any
 * set is logged the fallback chain is last week's FIRST working set (the top
 * set to match or beat), then the progression suggestion, then a plain 8-rep row.
 */
export const nextSetPrefill = (input: {
  /** Working (non-warm-up) sets logged this session, in order. */
  logged: PriorSet[];
  /** Planned reps for this row, when the prescription defines them. */
  planReps: number | undefined;
  /** Last week's sets for this slot, in order. */
  lastWeek: PriorSet[];
  /** Progression suggestion (kg), when history supports one. */
  suggestedKg: number | null;
}): { weightKg: number | null; reps: number } => {
  const { logged, planReps, lastWeek, suggestedKg } = input;
  const justDone = logged[logged.length - 1];
  if (justDone) return { weightKg: justDone.weightKg, reps: planReps ?? justDone.reps };
  const prior = lastWeek[0];
  if (prior) return { weightKg: prior.weightKg, reps: planReps ?? prior.reps };
  return { weightKg: suggestedKg, reps: planReps ?? 8 };
};
