import type { BmrSnapshot } from '@/features/auth/users.repo';
import type { User } from '@/db/schema';

import { bmr, tdee, type ActivityLevel, type BmrFormula, type Sex } from './math';

/** The calculator's short formula key → the value `users.bmr_formula` stores. */
export const FORMULA_ENUM: Record<BmrFormula, string> = {
  mifflin: 'mifflin_st_jeor',
  harris: 'harris_benedict',
  katch: 'katch_mcardle',
};

const FORMULA_FROM_PROFILE = Object.fromEntries(
  Object.entries(FORMULA_ENUM).map(([key, stored]) => [stored, key as BmrFormula]),
);

const DEFAULT_FORMULA: BmrFormula = 'mifflin';

/** A stored formula back to its key. Anything unknown falls back to Mifflin, and
 * the snapshot then stores Mifflin too, so the label never names a formula the
 * number did not come from. */
export const formulaFromProfile = (stored: string | null | undefined): BmrFormula =>
  FORMULA_FROM_PROFILE[stored ?? ''] ?? DEFAULT_FORMULA;

export type EnergyInputs = {
  formula: BmrFormula;
  sex: Sex | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: ActivityLevel | null;
  bodyFatPct?: number | null;
};

/** The BMR/TDEE snapshot the profile keeps, or null while an input is missing. */
export const energySnapshot = (i: EnergyInputs): BmrSnapshot | null => {
  if (!i.sex || !i.activityLevel || !i.age || !i.heightCm || !i.weightKg) return null;
  const b = bmr(i.formula, {
    sex: i.sex,
    weightKg: i.weightKg,
    heightCm: i.heightCm,
    age: i.age,
    bodyFatPct: i.bodyFatPct ?? undefined,
  });
  if (b <= 0) return null;
  return {
    bmr: b,
    tdee: tdee(b, i.activityLevel),
    bmrFormula: FORMULA_ENUM[i.formula],
    sex: i.sex,
    age: i.age,
    heightCm: i.heightCm,
    weightKg: i.weightKg,
    activityLevel: i.activityLevel,
  };
};

/** Re-run the profile's own formula on a fresh reading (the check-in's path). */
export const profileEnergySnapshot = (
  profile: Pick<User, 'sex' | 'age' | 'heightCm' | 'activityLevel' | 'bmrFormula'>,
  reading: { weightKg: number | null; bodyFatPct?: number | null },
): BmrSnapshot | null =>
  energySnapshot({
    formula: formulaFromProfile(profile.bmrFormula),
    sex: profile.sex,
    age: profile.age,
    heightCm: profile.heightCm,
    activityLevel: profile.activityLevel,
    ...reading,
  });

/** Only a reading dated today describes the lifter NOW. Re-saving a past day
 * corrects that day's row; letting it rewrite the profile would put stale
 * weight and body fat behind every target that reads it. */
export const readingUpdatesProfile = (date: string, today: string): boolean => date === today;
