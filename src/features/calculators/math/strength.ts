import { type OneRmFormula, type Sex, round } from './shared';

export const oneRm = (weight: number, reps: number, formula: OneRmFormula): number => {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return round(weight);
  const value = formula === 'brzycki' ? (weight * 36) / (37 - reps) : weight * (1 + reps / 30);
  return round(value);
};

/** Common training percentages of 1RM → estimated reps. */
export const RM_PERCENTAGES: { pct: number; reps: number }[] = [
  { pct: 100, reps: 1 },
  { pct: 95, reps: 2 },
  { pct: 90, reps: 4 },
  { pct: 85, reps: 6 },
  { pct: 80, reps: 8 },
  { pct: 75, reps: 10 },
  { pct: 70, reps: 12 },
];

const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];

export const plateLoad = (targetKg: number, barKg = 20) => {
  const perSide = (targetKg - barKg) / 2;
  const result: { plate: number; count: number }[] = [];
  let remaining = perSide;
  if (perSide > 0) {
    for (const plate of PLATES_KG) {
      const count = Math.floor(remaining / plate + 1e-9);
      if (count > 0) {
        result.push({ plate, count });
        remaining -= plate * count;
      }
    }
  }
  return {
    perSide: round(Math.max(0, perSide)),
    plates: result,
    remainder: round(Math.max(0, remaining)),
  };
};

const DOTS_COEFFS = {
  male: {
    a: -0.000001093,
    b: 0.0007391293,
    c: -0.1918759221,
    d: 24.0900756,
    e: -307.75076,
  },
  female: {
    a: -0.0000010706,
    b: 0.0005158568,
    c: -0.1126655495,
    d: 13.6175032,
    e: -57.96288,
  },
} as const;

export const dotsScore = (sex: Sex, bodyweightKg: number, totalKg: number): number => {
  const { a, b, c, d, e } = DOTS_COEFFS[sex];
  const bw = bodyweightKg;
  const denom = a * bw ** 4 + b * bw ** 3 + c * bw ** 2 + d * bw + e;
  if (denom === 0) return 0;
  return round((totalKg * 500) / denom);
};
