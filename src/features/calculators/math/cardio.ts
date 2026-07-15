import { type ActivityLevel, round } from './shared';

const ACTIVITY_WATER_BONUS: Record<ActivityLevel, number> = {
  sedentary: 0,
  light: 250,
  moderate: 500,
  active: 750,
  very_active: 1000,
};

export const hydration = (weightKg: number, activity: ActivityLevel) => {
  const ml = weightKg * 35 + ACTIVITY_WATER_BONUS[activity];
  return {
    ml: Math.round(ml),
    liters: round(ml / 1000),
    cups: Math.round(ml / 240),
  };
};

export const HR_ZONES = [
  { id: 'z1', lo: 0.5, hi: 0.6 },
  { id: 'z2', lo: 0.6, hi: 0.7 },
  { id: 'z3', lo: 0.7, hi: 0.8 },
  { id: 'z4', lo: 0.8, hi: 0.9 },
  { id: 'z5', lo: 0.9, hi: 1.0 },
] as const;

export const heartRateZones = (age: number, restingHr: number) => {
  const maxHr = round(208 - 0.7 * age, 0);
  const hrr = maxHr - restingHr;
  const bound = (pct: number) => Math.round(restingHr + pct * hrr);
  return {
    maxHr,
    zones: HR_ZONES.map((z) => ({
      id: z.id,
      lo: bound(z.lo),
      hi: bound(z.hi),
    })),
  };
};
