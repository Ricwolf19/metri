import { describe, expect, it } from 'vitest';

import { bmiConfig, bodyfat, ffmiConfig, idealweight, leanmass, whtr } from './configs/body';
import { heartrate, water } from './configs/cardio';
import { calsburned, deficit, macrosConfig, protein, tdeeConfig } from './configs/energy';
import { onerm, plates, wilks } from './configs/strength';
import { bodyFatNavy } from './math';
import { applyFactsToValues, type CalcFacts, initialCalcValues, PREFILL } from './prefill';
import type { CalcConfig, CalcId } from './types';

// The configs directly: the registry pulls in SVG components vitest can't load.
const CALCULATORS: Record<CalcId, CalcConfig> = {
  onerm,
  tdee: tdeeConfig,
  macros: macrosConfig,
  bodyfat,
  bmi: bmiConfig,
  ffmi: ffmiConfig,
  water,
  plates,
  idealweight,
  deficit,
  protein,
  leanmass,
  heartrate,
  whtr,
  wilks,
  calsburned,
};

const NONE: CalcFacts = {
  sex: null,
  age: null,
  heightCm: null,
  weightKg: null,
  bodyFatPct: null,
  activity: null,
  bmrFormula: null,
  maintenanceKcal: null,
  restingHr: null,
  waistCm: null,
  neckCm: null,
  hipsCm: null,
  goal: null,
  targetWeightKg: null,
  rateKgPerWeek: null,
};

const FACTS: CalcFacts = {
  ...NONE,
  sex: 'female',
  age: 31,
  heightCm: 165,
  weightKg: 62.4,
  bodyFatPct: 24,
  activity: 'active',
  neckCm: 32,
  waistCm: 71.5,
  hipsCm: 97,
};

const def = (config: CalcConfig, name: string) =>
  config.fields.find((f) => f.name === name)?.default;

describe('initialCalcValues', () => {
  it('opens the body-fat calculator on the lifter and their latest tape', () => {
    const v = initialCalcValues(bodyfat, FACTS);
    expect(v).toMatchObject({ sex: 'female', height: 165, neck: 32, waist: 71.5, hip: 97 });
  });

  // The regression C1 names: check-in and calculator must agree on the same
  // person — including a tape off the field's 0.5 step (inches typed in).
  it('makes the calculator and the check-in estimate compute the same body fat', () => {
    const tape = { neckCm: 32.39, waistCm: 71.12, hipsCm: 97.03 };
    const calc = bodyfat.compute(initialCalcValues(bodyfat, { ...FACTS, ...tape }));
    const checkin = bodyFatNavy({
      sex: 'female',
      heightCm: 165,
      neckCm: tape.neckCm,
      waistCm: tape.waistCm,
      hipCm: tape.hipsCm,
    });
    expect(calc?.primaryValue).toContain(String(checkin));
  });

  it('never treats the load on the bar as body weight', () => {
    expect(initialCalcValues(onerm, FACTS).weight).toBe(def(onerm, 'weight'));
    expect(initialCalcValues(plates, FACTS).target).toBe(def(plates, 'target'));
  });

  it('never reads the activity level as an exercise', () => {
    expect(initialCalcValues(calsburned, FACTS)).toMatchObject({
      activity: def(calsburned, 'activity'),
      weight: 62.4,
    });
  });

  it('falls back to defaults for unknown, invalid or out-of-range values', () => {
    const v = initialCalcValues(tdeeConfig, {
      ...FACTS,
      activity: 'couch',
      heightCm: 20,
      age: null,
    });
    expect(v.activity).toBe(def(tdeeConfig, 'activity'));
    expect(v.height).toBe(def(tdeeConfig, 'height'));
    expect(v.age).toBe(def(tdeeConfig, 'age'));
    expect(v.weight).toBe(62.4);
  });

  it('is just the defaults without facts', () => {
    for (const config of [bodyfat, tdeeConfig, deficit]) {
      const v = initialCalcValues(config, null);
      for (const f of config.fields) expect(v[f.name]).toBe(f.default);
    }
  });
});

describe('applyFactsToValues', () => {
  const seed = (config: CalcConfig, facts: CalcFacts) =>
    applyFactsToValues(config, initialCalcValues(config, null), facts);

  it('fills the formula and body fat in TDEE', () => {
    const { values, changed } = seed(tdeeConfig, { ...FACTS, bmrFormula: 'katch' });
    expect(changed).toBe(true);
    expect(values).toMatchObject({ sex: 'female', age: 31, bodyFat: 24, formula: 'katch' });
  });

  it('seeds macros from maintenance and the phase, the deficit from the cut', () => {
    const facts = {
      ...FACTS,
      maintenanceKcal: 2380,
      goal: 'cut',
      targetWeightKg: 56.4,
      rateKgPerWeek: 0.5,
    };
    expect(seed(macrosConfig, facts).values).toMatchObject({
      calories: 2380,
      weight: 62.4,
      goal: 'cut',
      bodyFat: 24,
    });
    expect(seed(deficit, facts).values).toMatchObject({ current: 62.4, goal: 56.4, rate: 0.5 });
    expect(seed(protein, facts).values).toMatchObject({ weight: 62.4, goal: 'cut' });
  });

  it('keeps the precision the field commits at, never the step', () => {
    expect(seed(bodyfat, { ...FACTS, hipsCm: 98.263 }).values.hip).toBe(98.26);
  });

  it('skips a fact the field cannot take, and reports when nothing moved', () => {
    const { values, changed } = seed(heartrate, { ...NONE, age: 7 });
    expect(values.age).toBe(def(heartrate, 'age'));
    expect(changed).toBe(false);
    expect(seed(onerm, FACTS).changed).toBe(false);
  });

  it('only maps fields that exist on each calculator', () => {
    for (const [id, map] of Object.entries(PREFILL)) {
      const names = CALCULATORS[id as CalcId].fields.map((f) => f.name);
      for (const field of Object.keys(map)) expect(names).toContain(field);
    }
  });
});

describe('usedWhen', () => {
  it('only gates on a select that exists in the same calculator', () => {
    for (const config of Object.values(CALCULATORS))
      for (const f of config.fields)
        if (f.usedWhen) {
          const gate = config.fields.find((g) => g.name === f.usedWhen?.field);
          expect(gate?.kind).toBe('select');
          // Every gated value is one the select can actually hold.
          for (const v of f.usedWhen.values)
            expect(gate?.kind === 'select' && gate.options.some((o) => o.value === v)).toBe(true);
        }
  });
});
