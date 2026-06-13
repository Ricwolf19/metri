import type { Sex } from '@/db/schema';

/**
 * Body-fat % via the U.S. Navy circumference method (log10, all inputs in cm).
 *  - Men:   495 / (1.0324 − 0.19077·log10(waist−neck) + 0.15456·log10(height)) − 450
 *  - Women: 495 / (1.29579 − 0.35004·log10(waist+hip−neck) + 0.22100·log10(height)) − 450
 */
export type BfCategory = 'essential' | 'athlete' | 'fitness' | 'average' | 'high';

export type NavyInput = {
  sex: Sex;
  heightCm: number;
  neckCm: number;
  waistCm: number;
  hipCm?: number; // required for women
};

export const calculateBodyFatNavy = (input: NavyInput): number | null => {
  const { sex, heightCm, neckCm, waistCm, hipCm } = input;
  if (heightCm <= 0 || neckCm <= 0 || waistCm <= 0) return null;

  let pct: number;
  if (sex === 'male') {
    const circ = waistCm - neckCm;
    if (circ <= 0) return null;
    pct = 495 / (1.0324 - 0.19077 * Math.log10(circ) + 0.15456 * Math.log10(heightCm)) - 450;
  } else {
    if (!hipCm || hipCm <= 0) return null;
    const circ = waistCm + hipCm - neckCm;
    if (circ <= 0) return null;
    pct = 495 / (1.29579 - 0.35004 * Math.log10(circ) + 0.221 * Math.log10(heightCm)) - 450;
  }

  if (!Number.isFinite(pct)) return null;
  return Math.round(Math.min(60, Math.max(2, pct)) * 10) / 10;
};

const THRESHOLDS: Record<Sex, [number, number, number, number]> = {
  // [essential<, athlete<, fitness<, average<] — above the last is "high"
  male: [6, 14, 18, 25],
  female: [14, 21, 25, 32],
};

export const classifyBodyFat = (sex: Sex, pct: number): BfCategory => {
  const [a, b, c, d] = THRESHOLDS[sex];
  if (pct < a) return 'essential';
  if (pct < b) return 'athlete';
  if (pct < c) return 'fitness';
  if (pct < d) return 'average';
  return 'high';
};
