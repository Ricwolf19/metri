import type { ActivityLevel, Sex } from '@/db/schema';

/**
 * Basal Metabolic Rate (BMR) + Total Daily Energy Expenditure (TDEE).
 *
 * Pure, synchronous, allocation-light — safe to run on every keystroke inside a
 * `useMemo`. Two formulas are offered:
 *
 *  - Harris–Benedict (revised, Roza & Shizgal 1984) — the one requested.
 *  - Mifflin–St Jeor (1990) — generally considered more accurate today; offered
 *    as an alternative so results can be cross-checked.
 *
 * TDEE = BMR × activity multiplier.
 */
export type BmrFormula = 'harris_benedict' | 'mifflin_st_jeor';

/**
 * Activity multipliers for TDEE. Labels/hints are NOT here — they're translated
 * in the UI via `activity.<key>` / `activityHint.<key>` i18n keys.
 */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Ordered list for rendering selectors. */
export const ACTIVITY_LEVELS: ActivityLevel[] = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
];

export const FORMULAS: Record<BmrFormula, { label: string; note: string }> = {
  harris_benedict: { label: 'Harris–Benedict', note: 'Revised 1984' },
  mifflin_st_jeor: { label: 'Mifflin–St Jeor', note: '1990 · often more accurate' },
};

export type BmrInput = {
  sex: Sex;
  age: number; // years
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  formula?: BmrFormula;
};

export type BmrResult = {
  bmr: number; // kcal/day at rest
  tdee: number; // kcal/day with activity
  multiplier: number;
  formula: BmrFormula;
};

const harrisBenedict = (sex: Sex, kg: number, cm: number, age: number): number =>
  sex === 'male'
    ? 88.362 + 13.397 * kg + 4.799 * cm - 5.677 * age
    : 447.593 + 9.247 * kg + 3.098 * cm - 4.33 * age;

const mifflinStJeor = (sex: Sex, kg: number, cm: number, age: number): number => {
  const base = 10 * kg + 6.25 * cm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
};

export const calculateBmr = (input: BmrInput): BmrResult => {
  const formula = input.formula ?? 'harris_benedict';
  const raw =
    formula === 'mifflin_st_jeor'
      ? mifflinStJeor(input.sex, input.weightKg, input.heightCm, input.age)
      : harrisBenedict(input.sex, input.weightKg, input.heightCm, input.age);

  const bmr = Math.max(0, Math.round(raw));
  const multiplier = ACTIVITY_MULTIPLIERS[input.activityLevel];
  return { bmr, tdee: Math.round(bmr * multiplier), multiplier, formula };
};

/** Field bounds for validation — generous but sane. */
const LIMITS = {
  age: { min: 10, max: 120 },
  heightCm: { min: 90, max: 250 },
  weightKg: { min: 25, max: 350 },
} as const;

export const isValidBmrInput = (p: {
  age?: number;
  heightCm?: number;
  weightKg?: number;
}): boolean => {
  const inRange = (v: number | undefined, { min, max }: { min: number; max: number }) =>
    typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
  return (
    inRange(p.age, LIMITS.age) &&
    inRange(p.heightCm, LIMITS.heightCm) &&
    inRange(p.weightKg, LIMITS.weightKg)
  );
};

const LB_PER_KG = 2.2046226218;
export const kgToLb = (kg: number) => kg * LB_PER_KG;
export const lbToKg = (lb: number) => lb / LB_PER_KG;

/** Thousands-grouped integer string — Hermes-safe (no reliance on Intl). */
export const formatKcal = (value: number): string =>
  Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
