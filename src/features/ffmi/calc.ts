/**
 * Fat-Free Mass Index (FFMI) — how much lean mass you carry relative to height.
 * A better "how muscular am I" gauge than BMI because it strips out fat.
 *
 *   Fat-free mass (kg) = weight × (1 − bodyFat% / 100)
 *   FFMI               = fat-free mass ÷ height(m)²
 *   Normalized FFMI    = FFMI + 6.1 × (1.8 − height(m))   ← adjusts to a 1.8 m reference
 */
export type FfmiInput = { heightCm: number; weightKg: number; bodyFatPct: number };

export type FfmiResult = {
  fatFreeMassKg: number;
  ffmi: number;
  normalizedFfmi: number;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export const calculateFfmi = ({ heightCm, weightKg, bodyFatPct }: FfmiInput): FfmiResult | null => {
  if (heightCm <= 0 || weightKg <= 0 || bodyFatPct < 0 || bodyFatPct >= 100) return null;
  const m = heightCm / 100;
  const fatFreeMass = weightKg * (1 - bodyFatPct / 100);
  const ffmi = fatFreeMass / (m * m);
  const normalizedFfmi = ffmi + 6.1 * (1.8 - m);
  return {
    fatFreeMassKg: round1(fatFreeMass),
    ffmi: round1(ffmi),
    normalizedFfmi: round1(normalizedFfmi),
  };
};

/** The classification bands shown on the colour scale (men-referenced, like the source). */
export type FfmiClassKey =
  | 'belowAverage'
  | 'average'
  | 'aboveAverage'
  | 'excellent'
  | 'superior'
  | 'suspicious'
  | 'unlikely';

export type FfmiBand = { max: number; key: FfmiClassKey; color: string };

/** Upper bound is exclusive; the last band catches everything above. */
export const FFMI_BANDS: FfmiBand[] = [
  { max: 18, key: 'belowAverage', color: '#ef4444' },
  { max: 20, key: 'average', color: '#f97316' },
  { max: 22, key: 'aboveAverage', color: '#eab308' },
  { max: 23, key: 'excellent', color: '#84cc16' },
  { max: 26, key: 'superior', color: '#22c55e' },
  { max: 28, key: 'suspicious', color: '#14b8a6' },
  { max: Infinity, key: 'unlikely', color: '#8b5cf6' },
];

/** The scale shown on the gauge / colour bar. */
export const FFMI_SCALE_MIN = 16;
export const FFMI_SCALE_MAX = 30;

export const classifyFfmi = (ffmi: number): FfmiBand =>
  FFMI_BANDS.find((b) => ffmi < b.max) ?? FFMI_BANDS[FFMI_BANDS.length - 1];
