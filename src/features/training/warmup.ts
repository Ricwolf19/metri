import { roundToPlate } from './progression';

/**
 * Percentages of the first WORKING set — heavier and shorter each step, so the
 * last one primes without cutting into the working sets. Nothing is logged
 * automatically; the ramp only prefills rows the lifter still confirms.
 */
const RAMP = [
  { pct: 0.4, reps: 8 },
  { pct: 0.6, reps: 5 },
  { pct: 0.8, reps: 3 },
] as const;

export type WarmupStep = { weightKg: number; reps: number };

/**
 * Steps for `workingKg`, rounded to the bar's smallest jump. Empty when there
 * is nothing to ramp toward (bodyweight work, or a load so light that every
 * step rounds onto the working weight itself) — an empty ramp means "no
 * suggestion", never a zero-weight row.
 */
export const warmupRamp = (workingKg: number | null, increment = 2.5): WarmupStep[] => {
  if (workingKg == null || !Number.isFinite(workingKg) || workingKg <= 0) return [];

  const steps: WarmupStep[] = [];
  for (const { pct, reps } of RAMP) {
    const weightKg = roundToPlate(workingKg * pct, increment);
    // A step at (or above) the working weight is not a warm-up, and repeating
    // the previous step adds nothing.
    if (weightKg <= 0 || weightKg >= workingKg) continue;
    if (steps.some((s) => s.weightKg === weightKg)) continue;
    steps.push({ weightKg, reps });
  }
  return steps;
};
