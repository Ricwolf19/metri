import type { BodyPhase, TrainingLevel } from '@/db/schema';

/**
 * How fast bodyweight should move. Slow on purpose in both directions: a faster
 * cut costs muscle and training quality, a faster bulk is mostly fat. All bands
 * are data, so tuning the method is an edit here, never to logic.
 *
 * Rates are SIGNED kg/week: negative loses, positive gains.
 */

/** Cut, by bodyweight — a heavier lifter can lose more per week at the same cost. */
const CUT_BANDS = [
  { upToKg: 70, min: 0.3, max: 0.35, pick: 0.3 },
  { upToKg: 100, min: 0.3, max: 0.5, pick: 0.4 },
  { upToKg: Infinity, min: 0.4, max: 0.5, pick: 0.5 },
] as const;

/** Bulk, as % of bodyweight per MONTH — the newer the lifter, the faster muscle comes. */
const BULK_PCT_PER_MONTH: Record<TrainingLevel, { min: number; max: number }> = {
  beginner: { min: 1, max: 1.5 },
  intermediate: { min: 0.5, max: 1 },
  advanced: { min: 0.25, max: 0.5 },
};

const WEEKS_PER_MONTH = 4.345;
/** Past this a "lean bulk" is simply gaining fat, whatever the percentage says. */
const BULK_CEILING_KG_PER_WEEK = 0.35;
/** Hard safety clamp on any rate, as a share of bodyweight per week. */
const MAX_SHARE_PER_WEEK = 0.01;

export type RateSuggestion = { kgPerWeek: number; minKg: number; maxKg: number };

const round2 = (n: number): number => Math.round(n * 100) / 100;

export const suggestRate = ({
  phase,
  weightKg,
  level = 'intermediate',
}: {
  phase: BodyPhase;
  weightKg: number;
  level?: TrainingLevel | null;
}): RateSuggestion => {
  if (phase === 'maintain' || phase === 'recomp') return { kgPerWeek: 0, minKg: 0, maxKg: 0 };

  if (phase === 'cut') {
    const band = CUT_BANDS.find((b) => weightKg < b.upToKg) ?? CUT_BANDS[CUT_BANDS.length - 1];
    return { kgPerWeek: -band.pick, minKg: band.min, maxKg: band.max };
  }

  const pct = BULK_PCT_PER_MONTH[level ?? 'intermediate'];
  const perWeek = (p: number) =>
    Math.min(BULK_CEILING_KG_PER_WEEK, round2(((p / 100) * weightKg) / WEEKS_PER_MONTH));
  const minKg = perWeek(pct.min);
  const maxKg = perWeek(pct.max);
  return { kgPerWeek: round2((minKg + maxKg) / 2), minKg, maxKg };
};

/** Keep a hand-set rate inside what is safe for this bodyweight. */
export const clampRate = (kgPerWeek: number, weightKg: number): number => {
  const limit = round2(weightKg * MAX_SHARE_PER_WEEK);
  return Math.max(-limit, Math.min(limit, kgPerWeek));
};
