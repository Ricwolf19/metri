import type { User } from '@/db/schema';

import { FORMULA_ENUM } from './energy-snapshot';
import { type ActivityLevel, type BmrFormula, type Sex, bmr, tdee } from './math';
import { type CalcFacts, type FactKey, PREFILL } from './prefill';
import type { CalcId } from './types';

/**
 * Merges the lifter's profile, their latest body logs and the calculations
 * they kept into `CalcFacts`. Pure, so the precedence is tested without a
 * database; `facts.repo.ts` reads the sources. Mirrors metri.info's
 * `buildCalcFacts` with ONE deliberate difference, documented on it below.
 */

/** `users.bmr_formula` (the stored enum) → the calculator's formula id. */
const FORMULA_FROM_PROFILE = Object.fromEntries(
  Object.entries(FORMULA_ENUM).map(([key, stored]) => [stored, key as BmrFormula]),
);

/** Phases that mean the same as a calculator goal (`recomp` has no
 * calculator equivalent, so it seeds nothing). */
const GOAL_FROM_PHASE: Record<string, string> = { cut: 'cut', maintain: 'maintain', bulk: 'bulk' };

export type ProfileFacts = Pick<
  User,
  'sex' | 'age' | 'heightCm' | 'weightKg' | 'bodyFatPct' | 'activityLevel' | 'bmrFormula' | 'tdee'
>;

export type LogFacts = {
  /** The newest weigh-in and the newest body-fat reading (`body_metrics`). */
  weightKg: number | null;
  bodyFatPct: number | null;
  tape: { waist?: number; neck?: number; hips?: number };
  /** The active `body_goals` row; `rateKgPerWeek` is signed (negative = losing). */
  goal: {
    phase: string;
    startWeightKg: number | null;
    rateKgPerWeek: number | null;
    durationWeeks: number | null;
    tdeeAtStart: number | null;
  } | null;
};

/** A kept `calculation_history` run: only the inputs that fed its result. */
export type SavedCalc = { calcId: string; inputs: unknown; createdAt: Date };

const YEAR_MS = 365.25 * 86_400_000;

/** A remote profile can carry the web's `'unset'`. */
const known = (v: string | null | undefined) => (v && v !== 'unset' ? v : null);

/** A stored 0 is "never measured", not a reading. */
const positive = (v: number | null | undefined) =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;

/**
 * The newest value of each fact across the kept calculations, read back
 * through `PREFILL` (a kept TDEE's `age` IS their age). An age kept a while
 * ago is aged forward.
 */
const factsFromSaved = (saved: SavedCalc[], now: Date) => {
  const out: Partial<Record<FactKey, number | string>> = {};
  const newestFirst = [...saved].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  for (const calc of newestFirst) {
    const map = PREFILL[calc.calcId as CalcId];
    if (!map || typeof calc.inputs !== 'object' || calc.inputs === null) continue;
    const inputs = calc.inputs as Record<string, unknown>;
    for (const [field, key] of Object.entries(map)) {
      const v = inputs[field];
      if (out[key] !== undefined) continue;
      if (typeof v === 'number' && Number.isFinite(v)) {
        out[key] =
          key === 'age' ? v + Math.floor((now.getTime() - calc.createdAt.getTime()) / YEAR_MS) : v;
      } else if (typeof v === 'string' && v) out[key] = v;
    }
  }
  return out;
};

const asNum = (v: number | string | undefined) => (typeof v === 'number' ? v : null);
const asStr = (v: number | string | undefined) => (typeof v === 'string' ? v : null);

/** Maintenance from the facts themselves, when they're complete. */
const estimateMaintenance = (f: CalcFacts): number | null => {
  if (!f.sex || !f.activity || !f.weightKg || !f.heightCm) return null;
  const formula = (f.bmrFormula ?? 'mifflin') as BmrFormula;
  if (formula !== 'katch' && !f.age) return null;
  if (formula === 'katch' && !f.bodyFatPct) return null;
  const b = bmr(formula, {
    sex: f.sex as Sex,
    weightKg: f.weightKg,
    heightCm: f.heightCm,
    age: f.age ?? 0,
    bodyFatPct: f.bodyFatPct ?? 0,
  });
  return b > 0 ? Math.round(tdee(b, f.activity as ActivityLevel)) : null;
};

/**
 * Merge the three sources. Weight and body fat read the PROFILE first, then
 * the newest log — the reverse of the web, on purpose: there the profile is
 * typed once on a website and the phone's logs are fresher, but here the
 * profile is kept FROM those logs (a weigh-in mirrors onto it, a check-in
 * dated today writes its body fat) and also takes what "Save to my profile"
 * stores, so it is never older than the newest log on this phone. The log
 * fills in when the profile has no value. Everything else is the web's
 * order: a dated log beats the profile, and both beat what the lifter typed
 * into a calculator last time.
 */
export const buildCalcFacts = ({
  profile,
  logs,
  saved,
  now,
}: {
  profile: ProfileFacts | null;
  logs: LogFacts;
  saved: SavedCalc[];
  now: Date;
}): CalcFacts => {
  const s = factsFromSaved(saved, now);
  const goal = logs.goal;
  const phase = goal ? (GOAL_FROM_PHASE[goal.phase] ?? null) : null;
  const target =
    goal?.phase === 'cut' && goal.startWeightKg && goal.rateKgPerWeek && goal.durationWeeks
      ? goal.startWeightKg - Math.abs(goal.rateKgPerWeek) * goal.durationWeeks
      : null;

  const facts: CalcFacts = {
    sex: known(profile?.sex) ?? asStr(s.sex),
    age: positive(profile?.age) ?? asNum(s.age),
    heightCm: positive(profile?.heightCm) ?? asNum(s.heightCm),
    weightKg: positive(profile?.weightKg) ?? positive(logs.weightKg) ?? asNum(s.weightKg),
    bodyFatPct: positive(profile?.bodyFatPct) ?? positive(logs.bodyFatPct) ?? asNum(s.bodyFatPct),
    activity: known(profile?.activityLevel) ?? asStr(s.activity),
    bmrFormula: FORMULA_FROM_PROFILE[profile?.bmrFormula ?? ''] ?? asStr(s.bmrFormula),
    maintenanceKcal: null,
    restingHr: asNum(s.restingHr),
    waistCm: positive(logs.tape.waist) ?? asNum(s.waistCm),
    neckCm: positive(logs.tape.neck) ?? asNum(s.neckCm),
    hipsCm: positive(logs.tape.hips) ?? asNum(s.hipsCm),
    goal: phase ?? asStr(s.goal),
    targetWeightKg: target ?? asNum(s.targetWeightKg),
    rateKgPerWeek:
      goal?.phase === 'cut' && goal.rateKgPerWeek
        ? Math.abs(goal.rateKgPerWeek)
        : asNum(s.rateKgPerWeek),
  };
  const storedKcal = positive(profile?.tdee) ?? positive(goal?.tdeeAtStart);
  facts.maintenanceKcal =
    (storedKcal !== null ? Math.round(storedKcal) : null) ??
    estimateMaintenance(facts) ??
    asNum(s.maintenanceKcal);
  return facts;
};
