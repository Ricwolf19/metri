/**
 * Healthy weight range + BMI. The "ideal" range is the WHO healthy-BMI band
 * (18.5–24.9) applied to height; BMI = kg / m².
 */
export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

const round1 = (n: number) => Math.round(n * 10) / 10;

export const idealWeightRange = (heightCm: number): { minKg: number; maxKg: number } | null => {
  if (heightCm <= 0) return null;
  const m = heightCm / 100;
  return { minKg: round1(18.5 * m * m), maxKg: round1(24.9 * m * m) };
};

export const calculateBmi = (weightKg: number, heightCm: number): number | null => {
  if (weightKg <= 0 || heightCm <= 0) return null;
  const m = heightCm / 100;
  return round1(weightKg / (m * m));
};

export const classifyBmi = (bmi: number): BmiCategory => {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
};
