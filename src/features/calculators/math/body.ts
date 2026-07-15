import { type Sex, round } from './shared';

export const bodyFatNavy = ({
  sex,
  heightCm,
  neckCm,
  waistCm,
  hipCm,
}: {
  sex: Sex;
  heightCm: number;
  neckCm: number;
  waistCm: number;
  hipCm?: number;
}): number => {
  const log10 = Math.log10;
  const value =
    sex === 'male'
      ? 495 / (1.0324 - 0.19077 * log10(waistCm - neckCm) + 0.15456 * log10(heightCm)) - 450
      : 495 /
          (1.29579 - 0.35004 * log10(waistCm + (hipCm ?? 0) - neckCm) + 0.221 * log10(heightCm)) -
        450;
  return value > 0 && Number.isFinite(value) ? round(value) : 0;
};

export const bodyFatCategory = (bf: number, sex: Sex): string => {
  const t =
    sex === 'male'
      ? { essential: 6, athlete: 14, fitness: 18, average: 25 }
      : { essential: 14, athlete: 21, fitness: 25, average: 32 };
  if (bf < t.essential) return 'essential';
  if (bf < t.athlete) return 'athlete';
  if (bf < t.fitness) return 'fitness';
  if (bf < t.average) return 'average';
  return 'high';
};

export const bmi = (weightKg: number, heightCm: number): number => {
  const m = heightCm / 100;
  if (m <= 0) return 0;
  return round(weightKg / (m * m));
};

export const bmiCategory = (value: number): string => {
  if (value < 18.5) return 'underweight';
  if (value < 25) return 'normal';
  if (value < 30) return 'overweight';
  return 'obese';
};

/** Healthy weight range (kg) for BMI 18.5–24.9. */
export const healthyWeightRange = (heightCm: number) => {
  const m = heightCm / 100;
  return { min: round(18.5 * m * m), max: round(24.9 * m * m) };
};

export const ffmi = ({
  weightKg,
  heightCm,
  bodyFatPct,
}: {
  weightKg: number;
  heightCm: number;
  bodyFatPct: number;
}) => {
  const m = heightCm / 100;
  if (m <= 0) return { raw: 0, normalized: 0 };
  const fatFree = weightKg * (1 - bodyFatPct / 100);
  const raw = fatFree / (m * m);
  const normalized = raw + 6.1 * (1.8 - m);
  return { raw: round(raw), normalized: round(normalized) };
};

export const ffmiBand = (normalized: number): string => {
  if (normalized < 18) return 'below';
  if (normalized < 20) return 'average';
  if (normalized < 22) return 'aboveAverage';
  if (normalized < 23) return 'excellent';
  if (normalized < 26) return 'superior';
  return 'suspicious';
};

export const idealWeight = (sex: Sex, heightCm: number) => {
  const inches = heightCm / 2.54;
  const over = Math.max(0, inches - 60);
  const devine = sex === 'male' ? 50 + 2.3 * over : 45.5 + 2.3 * over;
  const robinson = sex === 'male' ? 52 + 1.9 * over : 49 + 1.7 * over;
  return { devine: round(devine), robinson: round(robinson) };
};

export const leanMass = ({
  sex,
  weightKg,
  heightCm,
  bodyFatPct,
}: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  bodyFatPct: number;
}) => {
  const boer =
    sex === 'male'
      ? 0.407 * weightKg + 0.267 * heightCm - 19.2
      : 0.252 * weightKg + 0.473 * heightCm - 48.3;
  const fromBf = weightKg * (1 - bodyFatPct / 100);
  return {
    boer: round(Math.max(0, boer)),
    fromBf: round(Math.max(0, fromBf)),
    fatMass: round(Math.max(0, weightKg - fromBf)),
  };
};

export const waistToHeight = (waistCm: number, heightCm: number): number => {
  if (heightCm <= 0) return 0;
  return round(waistCm / heightCm, 2);
};

export const whtrBand = (ratio: number): string => {
  if (ratio < 0.4) return 'low';
  if (ratio < 0.5) return 'healthy';
  if (ratio < 0.6) return 'increased';
  return 'high';
};
