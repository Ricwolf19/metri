import { describe, expect, it } from 'vitest';

import { bodyFatNavy } from './math';
import { initialCalcValues, type PrefillProfile } from './prefill';
import { bodyfat } from './configs/body';
import { tdeeConfig } from './configs/energy';
import { onerm } from './configs/strength';

// The configs directly: the registry pulls in SVG components vitest can't load.
const CALCULATORS = { bodyfat, tdee: tdeeConfig, onerm };

const PROFILE: PrefillProfile = {
  sex: 'female',
  age: 31,
  heightCm: 165,
  weightKg: 62.4,
  bodyFatPct: 24,
  activityLevel: 'active',
};

describe('initialCalcValues', () => {
  it('opens the body-fat calculator on the lifter and their latest tape', () => {
    const v = initialCalcValues(CALCULATORS.bodyfat, PROFILE, { neck: 32, waist: 71.5, hips: 97 });
    expect(v).toMatchObject({ sex: 'female', height: 165, neck: 32, waist: 71.5, hip: 97 });
  });

  // The regression C1 names: check-in and calculator must agree on the same person.
  it('makes the calculator and the check-in estimate compute the same body fat', () => {
    const tape = { neck: 32, waist: 71.5, hips: 97 };
    const calc = CALCULATORS.bodyfat.compute(initialCalcValues(CALCULATORS.bodyfat, PROFILE, tape));
    const checkin = bodyFatNavy({
      sex: 'female',
      heightCm: 165,
      neckCm: tape.neck,
      waistCm: tape.waist,
      hipCm: tape.hips,
    });
    expect(calc?.primaryValue).toContain(String(checkin));
  });

  it('never treats the load on the bar as body weight', () => {
    const v = initialCalcValues(CALCULATORS.onerm, PROFILE);
    const def = CALCULATORS.onerm.fields.find((f) => f.name === 'weight')?.default;
    expect(v.weight).toBe(def);
  });

  it('falls back to defaults for unknown, invalid or out-of-range values', () => {
    const v = initialCalcValues(
      CALCULATORS.tdee,
      { ...PROFILE, activityLevel: 'couch', heightCm: 20, age: null },
      {},
    );
    const def = (name: string) => CALCULATORS.tdee.fields.find((f) => f.name === name)?.default;
    expect(v.activity).toBe(def('activity'));
    expect(v.height).toBe(def('height'));
    expect(v.age).toBe(def('age'));
    expect(v.weight).toBe(62.4);
  });

  it('is just the defaults without a profile', () => {
    const v = initialCalcValues(CALCULATORS.bodyfat, null);
    for (const f of CALCULATORS.bodyfat.fields) expect(v[f.name]).toBe(f.default);
  });
});
