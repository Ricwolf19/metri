import { describe, expect, it } from 'vitest';

import { bmr, calorieDeficit, caloriesBurned, macroTargets, proteinTarget, tdee } from './energy';

describe('bmr', () => {
  it('computes Mifflin-St Jeor for both sexes', () => {
    // 10*80 + 6.25*180 - 5*25 ± sex constant
    expect(bmr('mifflin', { sex: 'male', weightKg: 80, heightCm: 180, age: 25 })).toBe(1805);
    expect(bmr('mifflin', { sex: 'female', weightKg: 80, heightCm: 180, age: 25 })).toBe(1639);
  });

  it('computes revised Harris-Benedict', () => {
    expect(bmr('harris', { sex: 'male', weightKg: 80, heightCm: 180, age: 25 })).toBe(1882);
  });

  it('computes Katch-McArdle from lean body mass', () => {
    // lbm = 80 * 0.85 = 68 → 370 + 21.6 * 68
    expect(
      bmr('katch', { sex: 'male', weightKg: 80, heightCm: 180, age: 25, bodyFatPct: 15 }),
    ).toBe(1839);
  });

  it('katch without body fat treats the whole weight as lean', () => {
    expect(bmr('katch', { sex: 'male', weightKg: 80, heightCm: 180, age: 25 })).toBe(2098);
  });
});

describe('tdee', () => {
  it('multiplies bmr by the activity factor', () => {
    expect(tdee(1805, 'sedentary')).toBe(2166);
    expect(tdee(1805, 'moderate')).toBe(2798);
  });
});

describe('macroTargets', () => {
  it('scales protein to LEAN mass when body fat is known', () => {
    // 100 kg at 20% → 80 kg lean × 2.2 = 176 g; fat 0.7 g/kg on a cut = 70 g.
    const m = macroTargets({ kcal: 2500, weightKg: 100, bodyFatPct: 20, phase: 'cut' });
    expect(m).toMatchObject({ proteinG: 176, fatG: 70, basis: 'lean' });
    expect(m.carbsG).toBe(Math.round((2500 - 176 * 4 - 70 * 9) / 4));
  });

  it('falls back to bodyweight, and reports that it did', () => {
    const m = macroTargets({ kcal: 2500, weightKg: 80, phase: 'bulk' });
    expect(m).toMatchObject({ proteinG: 144, fatG: 72, basis: 'bodyweight' });
  });

  it('treats zero or absurd body fat as unknown', () => {
    expect(macroTargets({ kcal: 2500, weightKg: 80, bodyFatPct: 0, phase: 'cut' }).basis).toBe(
      'bodyweight',
    );
    expect(macroTargets({ kcal: 2500, weightKg: 80, bodyFatPct: 75, phase: 'cut' }).basis).toBe(
      'bodyweight',
    );
  });

  it('never drops fat under 0.5 g/kg', () => {
    for (const phase of ['cut', 'maintain', 'recomp', 'bulk'] as const) {
      expect(macroTargets({ kcal: 2000, weightKg: 80, phase }).fatG).toBeGreaterThanOrEqual(40);
    }
  });

  it('keeps the rounded macros close to the calorie target', () => {
    const m = macroTargets({ kcal: 2400, weightKg: 75, bodyFatPct: 15, phase: 'maintain' });
    expect(Math.abs(m.proteinG * 4 + m.carbsG * 4 + m.fatG * 9 - 2400)).toBeLessThanOrEqual(4);
  });

  it('reports exhausted carbs instead of going negative', () => {
    expect(macroTargets({ kcal: 500, weightKg: 100, phase: 'cut' })).toMatchObject({
      carbsG: 0,
      carbsExhausted: true,
    });
  });
});

describe('calorieDeficit', () => {
  it('plans a cut with rate, daily kcal and duration', () => {
    expect(calorieDeficit(80, 75, 0.5)).toEqual({
      direction: 'lose',
      toChange: 5,
      dailyKcal: 550,
      weeks: 10,
      months: 2.3,
    });
  });

  it('flips direction for a gain goal', () => {
    const plan = calorieDeficit(70, 75, 1);
    expect(plan.direction).toBe('gain');
    expect(plan.dailyKcal).toBe(1100);
    expect(plan.weeks).toBe(5);
  });

  it('falls back to 0.5 kg/week when the rate is not positive', () => {
    expect(calorieDeficit(80, 75, 0).weeks).toBe(10);
  });
});

describe('proteinTarget', () => {
  it('derives grams, kcal and a per-meal split from the goal', () => {
    expect(proteinTarget(80, 'bulk')).toEqual({ grams: 144, kcal: 576, perMeal: 36 });
  });
});

describe('caloriesBurned', () => {
  it('applies the MET formula per minute', () => {
    // (9.8 * 3.5 * 80) / 200 = 13.72 kcal/min
    expect(caloriesBurned(9.8, 80, 30)).toEqual({ total: 412, perHour: 823 });
  });
});
