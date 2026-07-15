/**
 * Shared primitives for the calculation modules — pure, no framework deps.
 * All inputs metric (kg, cm, years); callers handle units and labels.
 * Ported 1:1 from metri.info's lib/calculations so mobile and web stay in sync.
 */

export type Sex = 'male' | 'female';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type Goal = 'cut' | 'maintain' | 'bulk';

export type OneRmFormula = 'epley' | 'brzycki';

export type BmrFormula = 'harris' | 'mifflin' | 'katch';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const PROTEIN_PER_KG: Record<Goal, number> = {
  cut: 2.2,
  maintain: 2.0,
  bulk: 1.8,
};

export const round = (n: number, dp = 1) => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

/** Unit helpers (mobile-only — the web is metric-only). */
export const kgToLb = (kg: number) => kg * 2.2046226218;
export const lbToKg = (lb: number) => lb / 2.2046226218;
