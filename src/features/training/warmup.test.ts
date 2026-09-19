import { describe, expect, it } from 'vitest';

import { warmupRamp } from './warmup';

describe('warmupRamp', () => {
  it('ramps 40/60/80% of the working weight, rounded to the plate step', () => {
    // 100kg → 40 / 60 / 80, all exact multiples of 2.5.
    expect(warmupRamp(100)).toEqual([
      { weightKg: 40, reps: 8 },
      { weightKg: 60, reps: 5 },
      { weightKg: 80, reps: 3 },
    ]);
  });

  it('drops reps as the weight climbs', () => {
    const reps = warmupRamp(140).map((s) => s.reps);
    expect(reps).toEqual([...reps].sort((a, b) => b - a));
  });

  it.each<[string, number | null]>([
    ['bodyweight / zero', 0],
    ['unknown weight', null],
    ['negative', -20],
    ['not a number', Number.NaN],
  ])('returns no suggestion for %s', (_, input) => {
    expect(warmupRamp(input)).toEqual([]);
  });

  it('never suggests a step at or above the working weight', () => {
    for (const working of [2.5, 5, 7.5, 10, 20, 61.25]) {
      for (const step of warmupRamp(working)) {
        expect(step.weightKg).toBeLessThan(working);
        expect(step.weightKg).toBeGreaterThan(0);
      }
    }
  });

  it('collapses steps that round onto the same weight', () => {
    // 10kg → 4→5, 6→5, 8 : the first two both round to 5, so one is dropped.
    const weights = warmupRamp(10).map((s) => s.weightKg);
    expect(new Set(weights).size).toBe(weights.length);
  });

  it('honours a custom plate increment', () => {
    expect(warmupRamp(100, 5).map((s) => s.weightKg)).toEqual([40, 60, 80]);
    for (const step of warmupRamp(100, 5)) expect(step.weightKg % 5).toBe(0);
  });
});
