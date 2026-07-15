/**
 * Pure calculation logic for the 16 calculators — no framework or i18n deps so
 * it can be shared/tested anywhere. Mirrors metri.info's lib/calculations. All
 * inputs metric (kg, cm, years); callers handle units and labels.
 */

export {
  ACTIVITY_MULTIPLIERS,
  PROTEIN_PER_KG,
  round,
  kgToLb,
  lbToKg,
  type ActivityLevel,
  type BmrFormula,
  type Goal,
  type OneRmFormula,
  type Sex,
} from './shared';

export { RM_PERCENTAGES, dotsScore, oneRm, plateLoad } from './strength';

export {
  ACTIVITY_METS,
  bmr,
  calorieDeficit,
  caloriesBurned,
  macros,
  proteinTarget,
  tdee,
} from './energy';

export {
  bmi,
  bmiCategory,
  bodyFatCategory,
  bodyFatNavy,
  ffmi,
  ffmiBand,
  healthyWeightRange,
  idealWeight,
  leanMass,
  waistToHeight,
  whtrBand,
} from './body';

export { HR_ZONES, heartRateZones, hydration } from './cardio';
