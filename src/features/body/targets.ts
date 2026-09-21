import type { BodyPhase, Sex } from '@/db/schema';

/**
 * The energy side of a phase: the calorie target a pace implies, its guardrails,
 * and the carbs-only adjustment. The macro split itself is `macroTargets` in
 * `calculators/math` — one model, shared with the macros calculator.
 */

const KCAL_PER_KG_TISSUE = 7700;
const KCAL_PER_G_CARBS = 4;

/** A target further than this from maintenance gets a notice, not a veto. */
const SANITY_BAND = 0.2;
/** Guardrails, not physiology: nobody is steered under these or under ~BMR. */
const KCAL_FLOOR: Record<Sex, number> = { male: 1500, female: 1200 };
const BMR_MARGIN = 1.1;

const round10 = (n: number): number => Math.round(n / 10) * 10;

export type EnergyTarget = {
  kcal: number;
  /** The rate asked for less than is safe; the floor was used instead. */
  floored: boolean;
  /** More than ±20% from maintenance — worth a second look at the rate. */
  outsideBand: boolean;
};

/**
 * Maintenance shifted by what the chosen rate costs (or supplies) per day.
 * Derived from the RATE rather than a flat ±10%, because the rate is what the
 * weekly calendar will be judged against — the two must agree.
 */
export const energyTarget = ({
  tdee,
  bmr,
  rateKgPerWeek,
  sex,
}: {
  tdee: number;
  bmr: number | null;
  rateKgPerWeek: number;
  sex: Sex | null;
}): EnergyTarget => {
  const raw = tdee + (rateKgPerWeek * KCAL_PER_KG_TISSUE) / 7;
  const floor = Math.max(bmr ? bmr * BMR_MARGIN : 0, KCAL_FLOOR[sex ?? 'male']);
  const kcal = round10(Math.max(raw, floor));
  return {
    kcal,
    floored: raw < floor,
    outsideBand: Math.abs(kcal - tdee) / tdee > SANITY_BAND,
  };
};

type Adjustable = { kcal: number; carbsG: number };

/** Move the energy target by `kcalDelta`, through carbs alone. */
export const adjustCarbs = <T extends Adjustable>(targets: T, kcalDelta: number): T => ({
  ...targets,
  kcal: targets.kcal + kcalDelta,
  carbsG: Math.max(0, Math.round(targets.carbsG + kcalDelta / KCAL_PER_G_CARBS)),
});

const ADJUST_SHARE = 0.05;
const ADJUST_MIN_KCAL = 100;
/** Off-trend weeks in a row before food changes — one bad week is noise. */
const WEEKS_BEFORE_ADJUSTING = 2;

/**
 * The calorie step to propose after enough off-trend weeks, or null to leave
 * things alone. `trend` is the last completed weeks, newest last. Small on
 * purpose (≈5%, at least 100 kcal): adjust, then give it two weeks again.
 */
export const suggestAdjustment = ({
  trend,
  phase,
  targetKcal,
}: {
  trend: readonly ('ahead' | 'on' | 'behind')[];
  phase: BodyPhase;
  targetKcal: number;
}): number | null => {
  const recent = trend.slice(-WEEKS_BEFORE_ADJUSTING);
  if (recent.length < WEEKS_BEFORE_ADJUSTING) return null;
  const step = Math.max(ADJUST_MIN_KCAL, Math.round((targetKcal * ADJUST_SHARE) / 50) * 50);
  // "Behind" on a cut = not losing → eat less; on a bulk = not gaining → eat more.
  const towardGoal = phase === 'cut' ? -step : step;
  if (recent.every((s) => s === 'behind'))
    return phase === 'maintain' || phase === 'recomp' ? null : towardGoal;
  if (recent.every((s) => s === 'ahead'))
    return phase === 'maintain' || phase === 'recomp' ? null : -towardGoal;
  return null;
};
