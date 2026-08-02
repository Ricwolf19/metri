import { describe, expect, it } from 'vitest';

import { bmr, calorieDeficit, caloriesBurned, macros, proteinTarget, tdee } from './energy';

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

describe('macros', () => {
  it('splits calories into protein by goal, 25% fat, rest carbs', () => {
    expect(macros(2500, 80, 'cut')).toEqual({ protein: 176, fat: 69, carbs: 293 });
  });

  it('keeps the rounded macros close to the calorie target', () => {
    const { protein, fat, carbs } = macros(2500, 80, 'cut');
    const kcal = protein * 4 + fat * 9 + carbs * 4;
    expect(Math.abs(kcal - 2500)).toBeLessThanOrEqual(15);
  });

  it('never returns negative carbs when protein alone exceeds the target', () => {
    expect(macros(500, 100, 'cut').carbs).toBe(0);
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
