import type { BodyGoal, BodyPhase, Sex } from '@/db/schema';
import { macroTargets } from '@/features/calculators/math';

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

export type PhaseTargets = {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  /** What protein was scaled to — the copy says so. */
  basis: 'lean' | 'bodyweight';
  floored: boolean;
  outsideBand: boolean;
};

/**
 * Everything a phase eats from: the energy target its pace implies plus the
 * macro split (`macroTargets`, the calculator's model). `adjustmentKcal` is the
 * carb steps a running phase already took — they ride on top, through carbs.
 */
export const phaseTargets = ({
  phase,
  rateKgPerWeek,
  tdee,
  bmr,
  sex,
  weightKg,
  bodyFatPct,
  adjustmentKcal = 0,
}: {
  phase: BodyPhase;
  rateKgPerWeek: number;
  tdee: number;
  bmr: number | null;
  sex: Sex | null;
  weightKg: number;
  bodyFatPct: number | null;
  adjustmentKcal?: number;
}): PhaseTargets => {
  const energy = energyTarget({ tdee, bmr, rateKgPerWeek, sex });
  const macros = macroTargets({ kcal: energy.kcal + adjustmentKcal, weightKg, bodyFatPct, phase });
  return {
    kcal: macros.kcal,
    proteinG: macros.proteinG,
    fatG: macros.fatG,
    carbsG: macros.carbsG,
    basis: macros.basis,
    floored: energy.floored,
    outsideBand: energy.outsideBand,
  };
};

/** A refresh worth offering moves the target at least this much — the size of one adjustment step. */
const REFRESH_MIN_KCAL = 100;

/**
 * New targets for a RUNNING phase when the maintenance estimate it was
 * planned on has moved (a re-run TDEE, a check-in that refreshed it), or null
 * when the change is under one adjustment step. A phase freezes the inputs
 * its targets came from, so this is only ever offered, never applied
 * silently. The carb steps already taken are kept: they corrected the
 * estimate, and a new estimate from the same formula carries the same error.
 */
export const refreshedTargets = (
  goal: Pick<BodyGoal, 'phase' | 'rateKgPerWeek' | 'tdeeAtStart' | 'targetKcal' | 'adjustments'>,
  now: {
    tdee: number | null;
    bmr: number | null;
    sex: Sex | null;
    weightKg: number | null;
    bodyFatPct: number | null;
  },
): PhaseTargets | null => {
  if (now.tdee == null || now.weightKg == null) return null;
  if (goal.tdeeAtStart != null && Math.abs(now.tdee - goal.tdeeAtStart) < 1) return null;
  const next = phaseTargets({
    phase: goal.phase,
    rateKgPerWeek: goal.rateKgPerWeek,
    tdee: now.tdee,
    bmr: now.bmr,
    sex: now.sex,
    weightKg: now.weightKg,
    bodyFatPct: now.bodyFatPct,
    adjustmentKcal: (goal.adjustments ?? []).reduce((sum, a) => sum + a.kcalDelta, 0),
  });
  return Math.abs(next.kcal - goal.targetKcal) >= REFRESH_MIN_KCAL ? next : null;
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
