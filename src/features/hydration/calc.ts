import type { ActivityLevel } from '@/db/schema';

/**
 * Daily water target: ~35 ml per kg of body weight, plus an activity allowance
 * for sweat losses. A practical, commonly-cited estimate (not medical advice).
 */
const ML_PER_KG = 35;

const ACTIVITY_BONUS_ML: Record<ActivityLevel, number> = {
  sedentary: 0,
  light: 250,
  moderate: 500,
  active: 750,
  very_active: 1000,
};

export type WaterResult = { liters: number; ml: number; cups: number };

export const calculateWater = (input: {
  weightKg: number;
  activityLevel: ActivityLevel;
}): WaterResult => {
  const ml = Math.round(input.weightKg * ML_PER_KG + ACTIVITY_BONUS_ML[input.activityLevel]);
  return { ml, liters: Math.round(ml / 100) / 10, cups: Math.round(ml / 240) };
};
