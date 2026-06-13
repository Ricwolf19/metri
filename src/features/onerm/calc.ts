/**
 * One-rep max (1RM) estimation from a submaximal set.
 *
 *  - Epley:   1RM = w × (1 + reps/30)
 *  - Brzycki: 1RM = w × 36 / (37 − reps)   (only valid for reps < 37)
 *
 * Both are accurate for low-to-moderate reps and drift above ~10.
 */
export type OneRmFormula = 'epley' | 'brzycki';

export const ONERM_FORMULAS: OneRmFormula[] = ['epley', 'brzycki'];

export const calculateOneRm = (weight: number, reps: number, formula: OneRmFormula): number => {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return Math.round(weight);
  if (formula === 'brzycki' && reps < 37) return Math.round((weight * 36) / (37 - reps));
  // Epley (and Brzycki fallback when reps are out of its valid range).
  return Math.round(weight * (1 + reps / 30));
};

/** Common training-load percentages of 1RM with their approximate rep target. */
export const PERCENTAGES: { pct: number; reps: number }[] = [
  { pct: 100, reps: 1 },
  { pct: 95, reps: 2 },
  { pct: 90, reps: 4 },
  { pct: 85, reps: 6 },
  { pct: 80, reps: 8 },
  { pct: 75, reps: 10 },
  { pct: 70, reps: 12 },
  { pct: 65, reps: 15 },
];
