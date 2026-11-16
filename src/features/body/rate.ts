import type { BodyPhase, Sex, TrainingLevel } from '@/db/schema';

/**
 * How fast bodyweight should move. Slow on purpose in both directions: a faster
 * cut costs muscle and training quality, a faster bulk is mostly fat. All bands
 * are data, so tuning the method is an edit here, never to logic.
 *
 * Rates are SIGNED kg/week: negative loses, positive gains.
 */

/**
 * Cut, as % of bodyweight per WEEK, by body fat — the leaner the lifter, the
 * slower the cut that keeps muscle (natural lifters: ~0.5–1 %/week, the lean
 * end slower still). Inclusive upper bounds, checked in order; the lowest band
 * is `suggestPhase`'s bulk zone, where a cut is already a poor trade.
 */
const CUT_PCT_BY_FAT: Record<Sex, readonly { upToPct: number; min: number; max: number }[]> = {
  male: [
    { upToPct: 12, min: 0.25, max: 0.5 },
    { upToPct: 20, min: 0.5, max: 0.75 },
    { upToPct: 30, min: 0.5, max: 1 },
    { upToPct: Infinity, min: 0.75, max: 1 },
  ],
  female: [
    { upToPct: 20, min: 0.25, max: 0.5 },
    { upToPct: 28, min: 0.5, max: 0.75 },
    { upToPct: 38, min: 0.5, max: 1 },
    { upToPct: Infinity, min: 0.75, max: 1 },
  ],
};

/** Cut without a body-fat reading, by bodyweight — a heavier lifter can lose more per week. */
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
/** The editor steps rates by 0.05 kg, so a band edge must land on that grid —
 * the top edge rounded DOWN, so it never passes the 1 % `clampRate` applies. */
const round05 = (n: number): number => Math.round(n * 20) / 20;
const floor05 = (n: number): number => Math.floor(n * 20 + 1e-9) / 20;

/**
 * The healthy weekly pace for a phase, and the range the editor allows. With
 * a body-fat reading a cut follows it (`CUT_PCT_BY_FAT`); without one, the
 * bodyweight bands. A bulk follows training level.
 */
export const suggestRate = ({
  phase,
  weightKg,
  level = 'intermediate',
  sex = null,
  bodyFatPct = null,
}: {
  phase: BodyPhase;
  weightKg: number;
  level?: TrainingLevel | null;
  sex?: Sex | null;
  bodyFatPct?: number | null;
}): RateSuggestion => {
  if (phase === 'maintain' || phase === 'recomp') return { kgPerWeek: 0, minKg: 0, maxKg: 0 };

  if (phase === 'cut' && sex && bodyFatPct != null && bodyFatPct > 0) {
    const bands = CUT_PCT_BY_FAT[sex];
    const band = bands.find((b) => bodyFatPct <= b.upToPct) ?? bands[bands.length - 1];
    // Never under 0.1 kg (a pace the scale cannot show) nor over the 1 % clamp.
    const maxKg = Math.max(0.1, floor05((band.max / 100) * weightKg));
    const minKg = Math.min(maxKg, Math.max(0.1, round05((band.min / 100) * weightKg)));
    return { kgPerWeek: -round05((minKg + maxKg) / 2), minKg, maxKg };
  }

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
