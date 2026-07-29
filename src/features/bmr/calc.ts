import type { ActivityLevel } from '@/db/schema';

// The BMR/TDEE math lives in features/calculators/math/energy.ts (the generic
// calculator engine); this file keeps only what the app consumes directly.

/** Ordered for selectors. Labels are translated via `activity.<key>` i18n keys. */
export const ACTIVITY_LEVELS: ActivityLevel[] = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
];

const LB_PER_KG = 2.2046226218;
export const kgToLb = (kg: number) => kg * LB_PER_KG;
export const lbToKg = (lb: number) => lb / LB_PER_KG;
