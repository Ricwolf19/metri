import { describe, expect, it } from 'vitest';

import { bodyfat } from './configs/body';
import { tdeeConfig } from './configs/energy';
import { buildCalcFacts, type LogFacts, type ProfileFacts } from './facts';
import type { Sex } from './math';
import { fieldInUse } from './types';

const NOW = new Date('2026-11-16T12:00:00Z');

const NO_LOGS: LogFacts = { weightKg: null, bodyFatPct: null, tape: {}, goal: null };

const PROFILE: ProfileFacts = {
  sex: 'female',
  age: 34,
  heightCm: 165,
  weightKg: 70,
  bodyFatPct: 26,
  activityLevel: 'moderate',
  bmrFormula: 'katch_mcardle',
  tdee: null,
};

const EMPTY_PROFILE: ProfileFacts = {
  sex: null,
  age: null,
  heightCm: null,
  weightKg: null,
  bodyFatPct: null,
  activityLevel: null,
  bmrFormula: null,
  tdee: null,
};

const CUT: NonNullable<LogFacts['goal']> = {
  phase: 'cut',
  startWeightKg: 80,
  rateKgPerWeek: -0.5,
  durationWeeks: 12,
  tdeeAtStart: 2400,
};

describe('buildCalcFacts', () => {
  it('reads the profile first for weight and body fat, the newest tape over a kept run', () => {
    const facts = buildCalcFacts({
      profile: PROFILE,
      logs: { ...NO_LOGS, weightKg: 68.4, bodyFatPct: 24, tape: { waist: 74 } },
      saved: [
        { calcId: 'bodyfat', inputs: { waist: 80, neck: 33 }, createdAt: new Date('2026-10-01') },
      ],
      now: NOW,
    });
    // The profile is kept from the logs and takes "Save to my profile": never older here.
    expect(facts.weightKg).toBe(70);
    expect(facts.bodyFatPct).toBe(26);
    expect(facts.heightCm).toBe(165);
    expect(facts.waistCm).toBe(74);
    expect(facts.neckCm).toBe(33);
    expect(facts.bmrFormula).toBe('katch');
  });

  it('fills weight and body fat from the newest logs when the profile has none', () => {
    const facts = buildCalcFacts({
      profile: { ...EMPTY_PROFILE, weightKg: 0 },
      logs: { ...NO_LOGS, weightKg: 68.4, bodyFatPct: 24 },
      saved: [],
      now: NOW,
    });
    expect(facts.weightKg).toBe(68.4);
    expect(facts.bodyFatPct).toBe(24);
  });

  it('falls back to kept runs and ages a kept age forward', () => {
    const facts = buildCalcFacts({
      profile: null,
      logs: NO_LOGS,
      saved: [
        {
          calcId: 'tdee',
          inputs: { age: 25, sex: 'male', formula: 'harris' },
          createdAt: new Date('2019-01-01'),
        },
        {
          calcId: 'tdee',
          inputs: { age: 30, weight: 81, activity: '' },
          createdAt: new Date('2024-06-01'),
        },
      ],
      now: NOW,
    });
    expect(facts.age).toBe(32);
    expect(facts.weightKg).toBe(81);
    expect(facts.sex).toBe('male');
    expect(facts.bmrFormula).toBe('harris');
    // An empty string (a check-in run on a profile with no activity) is no fact.
    expect(facts.activity).toBeNull();
  });

  it("never takes the web's 'unset' or a stored zero as a value", () => {
    const facts = buildCalcFacts({
      // `restoreRemoteProfile` casts the server's sex straight onto the column.
      profile: { ...EMPTY_PROFILE, sex: 'unset' as string as Sex, age: 0, heightCm: 0 },
      logs: NO_LOGS,
      saved: [{ calcId: 'bodyfat', inputs: { sex: 'female' }, createdAt: new Date('2026-01-01') }],
      now: NOW,
    });
    expect(facts.sex).toBe('female');
    expect(facts.age).toBeNull();
    expect(facts.heightCm).toBeNull();
  });

  it('turns an active cut into a deficit target, rate and goal', () => {
    const facts = buildCalcFacts({
      profile: PROFILE,
      logs: { ...NO_LOGS, goal: CUT },
      saved: [],
      now: NOW,
    });
    expect(facts.goal).toBe('cut');
    expect(facts.targetWeightKg).toBe(74);
    expect(facts.rateKgPerWeek).toBe(0.5);
    expect(facts.maintenanceKcal).toBe(2400);
  });

  it('maps a bulk to its goal only, and a recomp to nothing', () => {
    const at = (phase: string) =>
      buildCalcFacts({
        profile: PROFILE,
        logs: { ...NO_LOGS, goal: { ...CUT, phase, rateKgPerWeek: 0.25 } },
        saved: [],
        now: NOW,
      });
    expect(at('bulk')).toMatchObject({ goal: 'bulk', targetWeightKg: null, rateKgPerWeek: null });
    expect(at('recomp')).toMatchObject({ goal: null, targetWeightKg: null });
  });

  it('prefers the stored TDEE, rounded, over the phase and the estimate', () => {
    const facts = buildCalcFacts({
      profile: { ...PROFILE, tdee: 2311.6 },
      logs: { ...NO_LOGS, goal: CUT },
      saved: [],
      now: NOW,
    });
    expect(facts.maintenanceKcal).toBe(2312);
  });

  it('estimates maintenance from complete facts when nothing stored it', () => {
    const facts = buildCalcFacts({
      profile: { ...PROFILE, bmrFormula: null },
      logs: NO_LOGS,
      saved: [],
      now: NOW,
    });
    expect(facts.maintenanceKcal).toBeGreaterThan(1800);
    expect(facts.maintenanceKcal).toBeLessThan(2600);
  });

  it('estimates nothing from Katch-McArdle without a body fat', () => {
    const facts = buildCalcFacts({
      profile: { ...PROFILE, bodyFatPct: null },
      logs: NO_LOGS,
      saved: [],
      now: NOW,
    });
    expect(facts.maintenanceKcal).toBeNull();
  });
});

describe('fieldInUse', () => {
  const field = (config: typeof tdeeConfig, name: string) => {
    const f = config.fields.find((x) => x.name === name);
    if (!f) throw new Error(name);
    return f;
  };

  it('uses body fat in TDEE only on Katch-McArdle, and sex and age only off it', () => {
    expect(fieldInUse(field(tdeeConfig, 'bodyFat'), { formula: 'mifflin' })).toBe(false);
    expect(fieldInUse(field(tdeeConfig, 'bodyFat'), { formula: 'katch' })).toBe(true);
    for (const name of ['sex', 'age']) {
      expect(fieldInUse(field(tdeeConfig, name), { formula: 'katch' })).toBe(false);
      expect(fieldInUse(field(tdeeConfig, name), { formula: 'harris' })).toBe(true);
      expect(fieldInUse(field(tdeeConfig, name), { formula: 'mifflin' })).toBe(true);
    }
    expect(fieldInUse(field(tdeeConfig, 'weight'), { formula: 'katch' })).toBe(true);
  });

  it("only uses hip circumference in the women's Navy formula", () => {
    expect(fieldInUse(field(bodyfat, 'hip'), { sex: 'male' })).toBe(false);
    expect(fieldInUse(field(bodyfat, 'hip'), { sex: 'female' })).toBe(true);
  });
});
