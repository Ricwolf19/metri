import { describe, expect, it } from 'vitest';

import { buildCalendar, judgedTrend, verdictFor } from './calendar';
import { interpretWeek } from './interpret';
import { suggestPhase } from './phase';
import { clampRate, suggestRate } from './rate';
import { enabledSites, keySiteFor } from './sites';
import { adjustCarbs, energyTarget, suggestAdjustment } from './targets';
import { fromCm, lengthUnitFor, toCm } from './units';
import { addDays, daysBetween, isWaterJump, weekIndexOf, weeklyAverages } from './weekly';

describe('weekly averages', () => {
  const ANCHOR = '2026-09-07';

  it('buckets by 7-day blocks from the anchor, not by calendar week', () => {
    expect(weekIndexOf('2026-09-07', ANCHOR)).toBe(0);
    expect(weekIndexOf('2026-09-13', ANCHOR)).toBe(0);
    expect(weekIndexOf('2026-09-14', ANCHOR)).toBe(1);
    expect(weekIndexOf('2026-09-06', ANCHOR)).toBe(-1);
  });

  it('averages a week and grades its confidence by how many weigh-ins it holds', () => {
    const entries = [
      { date: '2026-09-07', weightKg: 80 },
      { date: '2026-09-08', weightKg: 80.6 },
      { date: '2026-09-09', weightKg: 79.9 },
      { date: '2026-09-15', weightKg: 79.5 },
    ];
    const [w0, w1, w2] = weeklyAverages(entries, ANCHOR, 3);
    expect(w0).toMatchObject({ avgKg: 80.17, n: 3, confidence: 'ok' });
    expect(w1).toMatchObject({ avgKg: 79.5, n: 1, confidence: 'low' });
    expect(w2).toMatchObject({ avgKg: null, n: 0, confidence: 'none' });
  });

  it('keeps empty weeks so the timeline never collapses', () => {
    expect(weeklyAverages([], ANCHOR, 4).map((w) => w.weekStart)).toEqual([
      '2026-09-07',
      '2026-09-14',
      '2026-09-21',
      '2026-09-28',
    ]);
  });

  it('ignores weigh-ins from before the phase started', () => {
    const [w0] = weeklyAverages([{ date: '2026-09-01', weightKg: 99 }], ANCHOR, 1);
    expect(w0.n).toBe(0);
  });

  it('counts whole days across a DST change', () => {
    // Mexico no longer shifts, but the US and EU do: 7 local days must stay 7.
    expect(daysBetween('2026-10-24', '2026-10-31')).toBe(7);
    expect(addDays('2026-10-24', 7)).toBe('2026-10-31');
  });

  it.each<[number | null, number, boolean]>([
    [80, 81.2, true],
    [80, 78.9, true],
    [80, 80.6, false],
    [null, 85, false],
  ])('water jump from %s to %s → %s', (prev, next, expected) => {
    expect(isWaterJump(prev, next)).toBe(expected);
  });
});

describe('suggestRate', () => {
  it.each<[number, number]>([
    [62, -0.3],
    [85, -0.4],
    [110, -0.5],
  ])('cuts a %ikg lifter at %f kg/week', (weightKg, expected) => {
    expect(suggestRate({ phase: 'cut', weightKg }).kgPerWeek).toBe(expected);
  });

  it('bulks a beginner faster than an advanced lifter', () => {
    const beginner = suggestRate({ phase: 'bulk', weightKg: 80, level: 'beginner' }).kgPerWeek;
    const advanced = suggestRate({ phase: 'bulk', weightKg: 80, level: 'advanced' }).kgPerWeek;
    expect(beginner).toBeGreaterThan(advanced);
    expect(advanced).toBeGreaterThan(0);
  });

  it('never suggests a bulk past the point where it is mostly fat', () => {
    const { maxKg } = suggestRate({ phase: 'bulk', weightKg: 140, level: 'beginner' });
    expect(maxKg).toBeLessThanOrEqual(0.35);
  });

  it.each(['maintain', 'recomp'] as const)('holds weight on %s', (phase) => {
    expect(suggestRate({ phase, weightKg: 80 }).kgPerWeek).toBe(0);
  });

  it('clamps a hand-set rate to 1% of bodyweight per week, either direction', () => {
    expect(clampRate(-2, 60)).toBe(-0.6);
    expect(clampRate(2, 60)).toBe(0.6);
    expect(clampRate(-0.4, 80)).toBe(-0.4);
  });
});

describe('suggestPhase', () => {
  it.each<['male' | 'female', number, string]>([
    ['male', 10, 'bulk'],
    ['male', 12, 'bulk'],
    ['male', 14, 'recomp'],
    ['male', 22, 'cut'],
    ['female', 18, 'bulk'],
    ['female', 22, 'recomp'],
    ['female', 30, 'cut'],
  ])('%s at %i%% → %s', (sex, bodyFatPct, phase) => {
    expect(suggestPhase({ sex, bodyFatPct })?.phase).toBe(phase);
  });

  it('stays silent rather than guessing without body fat or sex', () => {
    expect(suggestPhase({ sex: 'male', bodyFatPct: null })).toBeNull();
    expect(suggestPhase({ sex: null, bodyFatPct: 15 })).toBeNull();
  });
});

describe('energyTarget', () => {
  it('shifts maintenance by what the rate costs per day', () => {
    // −0.4 kg/week × 7700 / 7 = −440 kcal/day.
    const t = energyTarget({ tdee: 2600, bmr: 1800, rateKgPerWeek: -0.4, sex: 'male' });
    expect(t).toMatchObject({ kcal: 2160, floored: false, outsideBand: false });
  });

  it('adds a surplus on a bulk', () => {
    expect(energyTarget({ tdee: 2600, bmr: 1800, rateKgPerWeek: 0.25, sex: 'male' }).kcal).toBe(
      2880,
    );
  });

  it('never steers a small lifter under her BMR margin, and says so', () => {
    // 1700 − 550 = 1150, below both the 1200 floor and BMR × 1.1 = 1430.
    const t = energyTarget({ tdee: 1700, bmr: 1300, rateKgPerWeek: -0.5, sex: 'female' });
    expect(t).toMatchObject({ kcal: 1430, floored: true });
  });

  it('flags — without vetoing — a target far from maintenance', () => {
    // 2400 − 550 = 1850: above the 1650 floor, but 23% under maintenance.
    const t = energyTarget({ tdee: 2400, bmr: 1500, rateKgPerWeek: -0.5, sex: 'male' });
    expect(t.outsideBand).toBe(true);
    expect(t.floored).toBe(false);
  });

  it('still floors when BMR is unknown', () => {
    expect(energyTarget({ tdee: 1500, bmr: null, rateKgPerWeek: -0.5, sex: 'female' }).kcal).toBe(
      1200,
    );
  });
});

describe('adjustCarbs', () => {
  const base = { kcal: 2400, proteinG: 160, fatG: 60, carbsG: 305 };

  it('moves energy through carbs alone — protein and fat stay put', () => {
    expect(adjustCarbs(base, -100)).toEqual({ ...base, kcal: 2300, carbsG: 280 });
    expect(adjustCarbs(base, 200)).toEqual({ ...base, kcal: 2600, carbsG: 355 });
  });

  it('cannot push carbs below zero', () => {
    expect(adjustCarbs(base, -5000).carbsG).toBe(0);
  });
});

describe('suggestAdjustment', () => {
  it('waits for two off-trend weeks — one is noise', () => {
    expect(suggestAdjustment({ trend: ['behind'], phase: 'cut', targetKcal: 2200 })).toBeNull();
    expect(
      suggestAdjustment({ trend: ['on', 'behind'], phase: 'cut', targetKcal: 2200 }),
    ).toBeNull();
  });

  it.each<['cut' | 'bulk', 'behind' | 'ahead', number]>([
    ['cut', 'behind', -100],
    ['cut', 'ahead', 100],
    ['bulk', 'behind', 150],
    ['bulk', 'ahead', -150],
  ])('%s and %s twice → %i kcal', (phase, status, expected) => {
    const targetKcal = phase === 'cut' ? 2200 : 3000;
    expect(suggestAdjustment({ trend: [status, status], phase, targetKcal })).toBe(expected);
  });

  it('only looks at the latest weeks', () => {
    const trend = ['behind', 'behind', 'on', 'on'] as const;
    expect(suggestAdjustment({ trend, phase: 'cut', targetKcal: 2200 })).toBeNull();
  });

  it('never proposes a change on maintenance', () => {
    expect(
      suggestAdjustment({ trend: ['behind', 'behind'], phase: 'recomp', targetKcal: 2500 }),
    ).toBeNull();
  });
});

describe('weight calendar', () => {
  const week = (index: number, avgKg: number | null, n = 5) => ({
    index,
    weekStart: addDays('2026-09-07', index * 7),
    avgKg,
    n,
    confidence: (n === 0 ? 'none' : n < 3 ? 'low' : 'ok') as 'ok' | 'low' | 'none',
  });
  const cut = { phase: 'cut' as const, startWeightKg: 80, rateKgPerWeek: -0.4 };

  it('derives each week’s target from the start weight and the rate', () => {
    const rows = buildCalendar(cut, [week(0, null, 0), week(1, null, 0), week(2, null, 0)]);
    expect(rows.map((r) => r.targetKg)).toEqual([80, 79.6, 79.2]);
    expect(rows.every((r) => r.status === 'pending')).toBe(true);
  });

  it.each<[number, string]>([
    [79.6, 'on'],
    [79.7, 'on'],
    [79.2, 'ahead'],
    [80.1, 'behind'],
  ])('a cut week averaging %f is %s', (avg, status) => {
    expect(buildCalendar(cut, [week(1, avg)])[0].status).toBe(status);
  });

  it('reads "ahead" the other way round on a bulk', () => {
    const bulk = { phase: 'bulk' as const, startWeightKg: 80, rateKgPerWeek: 0.25 };
    expect(buildCalendar(bulk, [week(2, 81)])[0].status).toBe('ahead');
    expect(buildCalendar(bulk, [week(2, 80.1)])[0].status).toBe('behind');
  });

  it('shows a thin week but never judges it', () => {
    const [row] = buildCalendar(cut, [week(1, 81, 1)]);
    expect(row).toMatchObject({ actualKg: 81, status: 'low-data' });
    expect(verdictFor(row)).toBeNull();
  });

  it('holds a small cushion, eases off a large one, pushes when behind', () => {
    const verdict = (avg: number) => verdictFor(buildCalendar(cut, [week(1, avg)])[0]);
    expect(verdict(79.4)).toBe('hold'); // 0.2 ahead — keep the cushion
    expect(verdict(78.9)).toBe('ease'); // 0.7 ahead — too fast
    expect(verdict(80.2)).toBe('push');
  });

  it('feeds only judged weeks to the adjustment rule', () => {
    const rows = buildCalendar(cut, [week(0, 80), week(1, 81, 1), week(2, 80.5), week(3, null, 0)]);
    expect(judgedTrend(rows)).toEqual(['on', 'behind']);
  });
});

describe('interpretWeek', () => {
  const read = (weightDeltaKg: number | null, keySiteDeltaCm: number | null, weekIndex = 5) =>
    interpretWeek({ phase: 'cut', weightDeltaKg, keySiteDeltaCm, weekIndex })?.code ?? null;

  it.each<[string, number, number, string]>([
    ['weight up, waist down', 0.6, -1, 'recomp'],
    ['weight flat, waist down', 0, -1, 'recomp'],
    ['weight down, waist flat', -0.8, 0, 'muscleRisk'],
    ['weight flat, waist up', 0, 1.2, 'overeating'],
    ['weight down, waist down', -0.5, -1, 'onTrack'],
    ['both inside the noise', 0.1, 0.2, 'onTrack'],
  ])('%s → %s', (_, w, s, code) => {
    expect(read(w, s)).toBe(code);
  });

  it('reads an early drop with an unchanged waist as water, not muscle', () => {
    expect(read(-1.5, 0, 0)).toBe('water');
    expect(read(-1.5, 0, 1)).toBe('water');
    expect(read(-1.5, 0, 2)).toBe('muscleRisk');
  });

  it('refuses to judge weight without the tape, or the tape without weight', () => {
    expect(read(-0.5, null)).toBeNull();
    expect(read(null, -1)).toBeNull();
  });
});

describe('sites and units', () => {
  it('always includes the core set and only the pro sites switched on', () => {
    expect(enabledSites([])).toHaveLength(7);
    expect(enabledSites(['neck', 'calf'])).toEqual([
      'chest',
      'waist',
      'hips',
      'arm_left',
      'arm_right',
      'leg_left',
      'leg_right',
      'neck',
      'calf',
    ]);
    expect(enabledSites(['not-a-site'])).toHaveLength(7);
  });

  it('watches the waist for men and the hips for women', () => {
    expect(keySiteFor('male')).toBe('waist');
    expect(keySiteFor('female')).toBe('hips');
    expect(keySiteFor(null)).toBe('waist');
  });

  it('round-trips inches through stored centimetres', () => {
    expect(lengthUnitFor('lb')).toBe('in');
    expect(lengthUnitFor('kg')).toBe('cm');
    expect(toCm(33, 'lb')).toBe(83.8);
    expect(fromCm(83.8, 'lb')).toBe(33);
    expect(fromCm(84, 'kg')).toBe(84);
  });
});
