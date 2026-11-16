import { describe, expect, it } from 'vitest';

import { CUT_BLOCK_WEEKS, cutDuration, cutGoal } from './plan';

describe('cutGoal', () => {
  // 95 kg at 25 % carries 71.25 kg lean: 12 % → 81 kg, 10 % → 79.2 kg, 8 % → 77.4 kg.
  it('ends a cut in the lean range the same lean mass allows', () => {
    expect(cutGoal({ sex: 'male', weightKg: 95, bodyFatPct: 25, heightCm: 180 })).toEqual({
      minKg: 79.2,
      maxKg: 81,
      pickKg: 81,
      floorKg: 77.4,
      basis: 'bodyFat',
      alreadyLean: false,
    });
  });

  it('flags a lifter already in that range', () => {
    expect(cutGoal({ sex: 'female', weightKg: 60, bodyFatPct: 19, heightCm: 165 })).toMatchObject({
      alreadyLean: true,
    });
  });

  it('falls back to the healthy BMI band without a body-fat reading', () => {
    expect(cutGoal({ sex: 'male', weightKg: 95, bodyFatPct: null, heightCm: 180 })).toEqual({
      minKg: 71.3,
      maxKg: 80.7,
      pickKg: 80.7,
      floorKg: 59.9,
      basis: 'bmi',
      alreadyLean: false,
    });
  });

  it('is null with nothing to read from', () => {
    expect(cutGoal({ sex: null, weightKg: 95, bodyFatPct: null, heightCm: null })).toBeNull();
  });
});

describe('cutDuration', () => {
  it('derives the weeks from the goal and the pace', () => {
    expect(cutDuration(4, 0.5)).toEqual({
      totalWeeks: 8,
      blocks: 1,
      firstBlockWeeks: 8,
      calendarWeeks: 8,
    });
  });

  // 14 kg at 0.5 kg/week is 28 weeks of deficit: three blocks, two breaks.
  it('splits a long cut into blocks with maintenance breaks between', () => {
    expect(cutDuration(14, 0.5)).toEqual({
      totalWeeks: 28,
      blocks: 3,
      firstBlockWeeks: CUT_BLOCK_WEEKS,
      calendarWeeks: 32,
    });
  });

  it('is null when there is nothing to lose', () => {
    expect(cutDuration(0, 0.5)).toBeNull();
    expect(cutDuration(3, 0)).toBeNull();
  });
});
