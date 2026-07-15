import {
  ACTIVITY_MULTIPLIERS,
  type ActivityLevel,
  type BmrFormula,
  type Goal,
  PROTEIN_PER_KG,
  type Sex,
  round,
} from './shared';

export const bmr = (
  formula: BmrFormula,
  {
    sex,
    weightKg,
    heightCm,
    age,
    bodyFatPct,
  }: {
    sex: Sex;
    weightKg: number;
    heightCm: number;
    age: number;
    bodyFatPct?: number;
  },
): number => {
  if (formula === 'mifflin') {
    return round(10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161), 0);
  }
  if (formula === 'katch') {
    const lbm = weightKg * (1 - (bodyFatPct ?? 0) / 100);
    return round(370 + 21.6 * lbm, 0);
  }
  return sex === 'male'
    ? round(88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age, 0)
    : round(447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age, 0);
};

export const tdee = (bmrValue: number, activity: ActivityLevel): number =>
  round(bmrValue * ACTIVITY_MULTIPLIERS[activity], 0);

export const macros = (calories: number, weightKg: number, goal: Goal) => {
  const protein = round(PROTEIN_PER_KG[goal] * weightKg, 0);
  const proteinKcal = protein * 4;
  const fatKcal = calories * 0.25;
  const fat = round(fatKcal / 9, 0);
  const carbsKcal = Math.max(0, calories - proteinKcal - fatKcal);
  const carbs = round(carbsKcal / 4, 0);
  return { protein, fat, carbs };
};

const KCAL_PER_KG = 7700;

export const calorieDeficit = (
  currentWeightKg: number,
  goalWeightKg: number,
  weeklyRateKg: number,
) => {
  const diff = currentWeightKg - goalWeightKg;
  const toChange = Math.abs(diff);
  const rate = weeklyRateKg > 0 ? weeklyRateKg : 0.5;
  const weeks = toChange / rate;
  const dailyKcal = (rate * KCAL_PER_KG) / 7;
  return {
    direction: diff >= 0 ? ('lose' as const) : ('gain' as const),
    toChange: round(toChange),
    dailyKcal: round(dailyKcal, 0),
    weeks: round(weeks),
    months: round(weeks / 4.345),
  };
};

export const proteinTarget = (weightKg: number, goal: Goal) => {
  const grams = round(PROTEIN_PER_KG[goal] * weightKg, 0);
  return {
    grams,
    kcal: grams * 4,
    perMeal: round(grams / 4, 0),
  };
};

export const ACTIVITY_METS: Record<string, number> = {
  walking: 3.5,
  running: 9.8,
  cycling: 7.5,
  swimming: 8.3,
  weightlifting: 6.0,
  hiit: 8.0,
  yoga: 2.8,
  soccer: 7.0,
};

export const caloriesBurned = (met: number, weightKg: number, minutes: number) => {
  const perMin = (met * 3.5 * weightKg) / 200;
  return {
    total: round(perMin * minutes, 0),
    perHour: round(perMin * 60, 0),
  };
};
