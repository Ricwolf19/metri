import type { Sex } from '@/db/schema';

/**
 * Where a cut should END and how long it takes — so the lifter names a goal
 * and metri works out a healthy plan, instead of a duration picked first and a
 * pace that has to make it fit. Bands are data; tune them here.
 */

/**
 * Body fat a cut ends at: lean enough to start a lean bulk or hold maintenance,
 * before more loss starts to cost muscle. The top edge is `suggestPhase`'s bulk
 * zone, so the editor recommends what the phase suggestion would.
 */
const CUT_END_PCT: Record<Sex, { min: number; max: number }> = {
  male: { min: 10, max: 12 },
  female: { min: 18, max: 20 },
};
/** No goal under this is offered: essential fat plus a margin, not a target. */
const LEAN_FLOOR_PCT: Record<Sex, number> = { male: 8, female: 16 };
/** A lean bulk stops here — past it `suggestPhase` already says cut. */
export const BULK_END_PCT: Record<Sex, number> = { male: 15, female: 24 };
/** Without a body-fat reading, the healthy BMI band stands in (crude on muscular lifters);
 * the recommended end runs from its middle to its top. */
const BMI_HEALTHY = { min: 18.5, mid: 22, max: 24.9 };

/** Longest stretch of deficit before a maintenance break: a longer cut costs NEAT,
 * training quality and adherence more than it saves in weeks. */
export const CUT_BLOCK_WEEKS = 12;
/** Weeks at maintenance between two cut blocks. */
export const BREAK_WEEKS = 2;

const round1 = (n: number): number => Math.round(n * 10) / 10;

/** The bodyweight at which the same lean mass sits at `targetPct` body fat. */
const weightAtBodyFat = (weightKg: number, bodyFatPct: number, targetPct: number): number =>
  (weightKg * (1 - bodyFatPct / 100)) / (1 - targetPct / 100);

export type CutGoal = {
  /** The recommended end, as a range; `pickKg` is the conservative top of it. */
  minKg: number;
  maxKg: number;
  pickKg: number;
  /** No goal under this: the lean floor (or BMI 18.5). */
  floorKg: number;
  /** What the range was read from — the copy says so. */
  basis: 'bodyFat' | 'bmi';
  /** Already at or under the end range: a cut would cost muscle for little. */
  alreadyLean: boolean;
};

/**
 * The recommended end of a cut: the lean range from a body-fat reading, else
 * the healthy BMI band from height. Null when there is nothing to read it from.
 */
export const cutGoal = ({
  sex,
  weightKg,
  bodyFatPct,
  heightCm,
}: {
  sex: Sex | null;
  weightKg: number;
  bodyFatPct: number | null;
  heightCm: number | null;
}): CutGoal | null => {
  if (!(weightKg > 0)) return null;
  if (sex && bodyFatPct != null && bodyFatPct > 0 && bodyFatPct < 70) {
    const end = CUT_END_PCT[sex];
    const maxKg = round1(weightAtBodyFat(weightKg, bodyFatPct, end.max));
    return {
      minKg: round1(weightAtBodyFat(weightKg, bodyFatPct, end.min)),
      maxKg,
      pickKg: maxKg,
      floorKg: round1(weightAtBodyFat(weightKg, bodyFatPct, LEAN_FLOOR_PCT[sex])),
      basis: 'bodyFat',
      alreadyLean: bodyFatPct <= end.max,
    };
  }
  if (heightCm != null && heightCm > 0) {
    const m2 = (heightCm / 100) ** 2;
    const maxKg = round1(BMI_HEALTHY.max * m2);
    return {
      minKg: round1(BMI_HEALTHY.mid * m2),
      maxKg,
      pickKg: maxKg,
      floorKg: round1(BMI_HEALTHY.min * m2),
      basis: 'bmi',
      alreadyLean: weightKg <= maxKg,
    };
  }
  return null;
};

export type CutDuration = {
  /** Weeks of deficit to the goal at this pace. */
  totalWeeks: number;
  /** Blocks of at most `CUT_BLOCK_WEEKS`; the phase saved is the first one. */
  blocks: number;
  firstBlockWeeks: number;
  /** Deficit weeks plus the maintenance breaks between blocks. */
  calendarWeeks: number;
};

/** How long a cut of `toLoseKg` takes at `rateKgPerWeek`, split into healthy blocks. */
export const cutDuration = (toLoseKg: number, rateKgPerWeek: number): CutDuration | null => {
  if (!(toLoseKg > 0) || !(rateKgPerWeek > 0)) return null;
  const totalWeeks = Math.max(1, Math.ceil(toLoseKg / rateKgPerWeek - 1e-9));
  const blocks = Math.ceil(totalWeeks / CUT_BLOCK_WEEKS);
  return {
    totalWeeks,
    blocks,
    firstBlockWeeks: Math.min(totalWeeks, CUT_BLOCK_WEEKS),
    calendarWeeks: totalWeeks + (blocks - 1) * BREAK_WEEKS,
  };
};
