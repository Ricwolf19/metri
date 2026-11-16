import type { CalcConfig, CalcId, CalcValues } from './types';

/**
 * What the app knows about the lifter, in calculator units (kg, cm, %, kcal,
 * years), assembled by `buildCalcFacts` (`facts.ts`) from the profile, the
 * latest body logs and the calculations they kept. Every fact is null when
 * unknown. Same shape as metri.info's `CalcFacts` (minus its units
 * preference: the app's calculators are metric), so both apps open a
 * calculator on the same numbers.
 */
export type CalcFacts = {
  sex: string | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  bodyFatPct: number | null;
  activity: string | null;
  /** Calculator formula id (`mifflin` | `harris` | `katch`). */
  bmrFormula: string | null;
  maintenanceKcal: number | null;
  restingHr: number | null;
  waistCm: number | null;
  neckCm: number | null;
  hipsCm: number | null;
  /** The active phase, when it maps onto a calculator goal. */
  goal: string | null;
  targetWeightKg: number | null;
  rateKgPerWeek: number | null;
};

export type FactKey = keyof CalcFacts;

/**
 * Which fact seeds which input, per calculator — metri.info's `PREFILL`, 1:1.
 * Centralised so it's easy to audit what a field means: a calculator's
 * `weight` maps to body weight only when that's what it is. 1RM/plate
 * `weight`/`target` are *lifted* loads and `calsburned.activity` is an
 * exercise, so they're deliberately absent.
 */
export const PREFILL: Partial<Record<CalcId, Record<string, FactKey>>> = {
  tdee: {
    sex: 'sex',
    age: 'age',
    height: 'heightCm',
    weight: 'weightKg',
    bodyFat: 'bodyFatPct',
    activity: 'activity',
    formula: 'bmrFormula',
  },
  macros: { calories: 'maintenanceKcal', weight: 'weightKg', goal: 'goal', bodyFat: 'bodyFatPct' },
  deficit: { current: 'weightKg', goal: 'targetWeightKg', rate: 'rateKgPerWeek' },
  protein: { weight: 'weightKg', goal: 'goal' },
  calsburned: { weight: 'weightKg' },
  bodyfat: { sex: 'sex', height: 'heightCm', neck: 'neckCm', waist: 'waistCm', hip: 'hipsCm' },
  bmi: { height: 'heightCm', weight: 'weightKg' },
  ffmi: { weight: 'weightKg', height: 'heightCm', bodyFat: 'bodyFatPct' },
  idealweight: { sex: 'sex', height: 'heightCm' },
  leanmass: { sex: 'sex', weight: 'weightKg', height: 'heightCm', bodyFat: 'bodyFatPct' },
  whtr: { waist: 'waistCm', height: 'heightCm' },
  water: { weight: 'weightKg', activity: 'activity' },
  heartrate: { age: 'age', resting: 'restingHr' },
  wilks: { sex: 'sex', bodyweight: 'weightKg' },
};

/**
 * The precision a number field commits at (`NumberField` rounds to 0.01).
 * The web snaps a fact to the field's step because its sliders live on that
 * grid; the app has no slider and its fields take any value in range, so a
 * tape of 71.3 cm stays 71.3 — snapping it to the 0.5 step would make this
 * calculator disagree with the check-in's Navy estimate (C1).
 */
const toFieldPrecision = (value: number) => Math.round(value * 100) / 100;

/** Seed `values` (metric) from the lifter's facts. A fact only lands when the
 * field would accept it — inside its range, or one of its options — so a
 * prefill never opens a calculator on a value its own input would refuse. */
export const applyFactsToValues = (
  config: CalcConfig,
  values: CalcValues,
  facts: CalcFacts,
): { values: CalcValues; changed: boolean } => {
  const map = PREFILL[config.id];
  if (!map) return { values, changed: false };

  const next = { ...values };
  let changed = false;
  for (const field of config.fields) {
    const key = map[field.name];
    const fact = key ? facts[key] : null;
    if (fact === null || fact === undefined) continue;
    const fits =
      field.kind === 'select'
        ? field.options.some((o) => o.value === fact)
        : typeof fact === 'number' &&
          Number.isFinite(fact) &&
          (field.min === undefined || fact >= field.min) &&
          (field.max === undefined || fact <= field.max);
    if (!fits) continue;
    const value = typeof fact === 'number' ? toFieldPrecision(fact) : fact;
    if (next[field.name] === value) continue;
    next[field.name] = value;
    changed = true;
  }
  return { values: next, changed };
};

/** The field defaults, then whatever the facts fill in. Read once, when the
 * calculator opens: every value stays editable and nothing re-seeds under the
 * lifter's edits. */
export const initialCalcValues = (config: CalcConfig, facts: CalcFacts | null): CalcValues => {
  const defaults: CalcValues = Object.fromEntries(config.fields.map((f) => [f.name, f.default]));
  return facts ? applyFactsToValues(config, defaults, facts).values : defaults;
};
