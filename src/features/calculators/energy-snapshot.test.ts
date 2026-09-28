import { describe, expect, it } from 'vitest';

import {
  FORMULA_ENUM,
  energySnapshot,
  formulaFromProfile,
  profileEnergySnapshot,
  readingUpdatesProfile,
} from './energy-snapshot';

const PROFILE = {
  sex: 'male' as const,
  age: 30,
  heightCm: 180,
  activityLevel: 'moderate' as const,
  bmrFormula: 'harris_benedict',
};

describe('energy snapshot', () => {
  it('is null while the profile is incomplete (the check-in then saves body fat only)', () => {
    expect(profileEnergySnapshot({ ...PROFILE, age: null }, { weightKg: 80 })).toBeNull();
    expect(profileEnergySnapshot({ ...PROFILE, activityLevel: null }, { weightKg: 80 })).toBeNull();
    expect(profileEnergySnapshot(PROFILE, { weightKg: null, bodyFatPct: 15 })).toBeNull();
  });

  it('runs the profile formula and stores it back unchanged', () => {
    const snap = profileEnergySnapshot(PROFILE, { weightKg: 80 });
    expect(snap?.bmrFormula).toBe('harris_benedict');
    expect(snap?.bmr).toBeGreaterThan(0);
    expect(snap?.tdee).toBeGreaterThan(snap?.bmr ?? Infinity);
  });

  // The old check-in computed Mifflin but stored the raw unknown value back.
  it('falls back to Mifflin for an unknown formula and stores what it computed', () => {
    expect(formulaFromProfile('something_else')).toBe('mifflin');
    expect(formulaFromProfile(null)).toBe('mifflin');
    const snap = profileEnergySnapshot({ ...PROFILE, bmrFormula: 'nope' }, { weightKg: 80 });
    const mifflin = energySnapshot({ ...PROFILE, formula: 'mifflin', weightKg: 80 });
    expect(snap).toEqual(mifflin);
    expect(snap?.bmrFormula).toBe('mifflin_st_jeor');
  });

  it('round-trips every formula key through the stored value', () => {
    for (const [key, stored] of Object.entries(FORMULA_ENUM)) {
      expect(formulaFromProfile(stored)).toBe(key);
    }
  });

  it('lets only a reading dated today rewrite the profile', () => {
    expect(readingUpdatesProfile('2026-09-28', '2026-09-28')).toBe(true);
    expect(readingUpdatesProfile('2026-09-21', '2026-09-28')).toBe(false);
  });
});
