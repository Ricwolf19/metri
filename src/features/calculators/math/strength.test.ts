import { describe, expect, it } from 'vitest';

import { dotsScore, oneRm, plateLoad, RM_PERCENTAGES } from './strength';

describe('oneRm', () => {
  it('computes Epley and Brzycki estimates', () => {
    expect(oneRm(100, 5, 'epley')).toBe(116.7); // 100 * (1 + 5/30)
    expect(oneRm(100, 5, 'brzycki')).toBe(112.5); // 100 * 36 / 32
  });

  it('a single rep is already the 1RM', () => {
    expect(oneRm(100, 1, 'epley')).toBe(100);
    expect(oneRm(100, 1, 'brzycki')).toBe(100);
  });

  it('returns 0 for non-positive weight or reps', () => {
    expect(oneRm(0, 5, 'epley')).toBe(0);
    expect(oneRm(100, 0, 'epley')).toBe(0);
    expect(oneRm(-10, 5, 'brzycki')).toBe(0);
  });
});

describe('RM_PERCENTAGES', () => {
  it('is ordered heaviest-first with strictly increasing reps', () => {
    for (let i = 1; i < RM_PERCENTAGES.length; i++) {
      expect(RM_PERCENTAGES[i].pct).toBeLessThan(RM_PERCENTAGES[i - 1].pct);
      expect(RM_PERCENTAGES[i].reps).toBeGreaterThan(RM_PERCENTAGES[i - 1].reps);
    }
  });
});

describe('plateLoad', () => {
  it('greedily fills a side with the largest plates', () => {
    expect(plateLoad(100)).toEqual({
      perSide: 40,
      plates: [
        { plate: 25, count: 1 },
        { plate: 15, count: 1 },
      ],
      remainder: 0,
    });
  });

  it('resolves fractional loads down to the smallest plate', () => {
    expect(plateLoad(57.5)).toEqual({
      perSide: 18.8, // rounded for display; plates carry the exact 18.75
      plates: [
        { plate: 15, count: 1 },
        { plate: 2.5, count: 1 },
        { plate: 1.25, count: 1 },
      ],
      remainder: 0,
    });
  });

  it('reports what cannot be plated as remainder', () => {
    expect(plateLoad(21).remainder).toBe(0.5);
    expect(plateLoad(21).plates).toEqual([]);
  });

  it('clamps a target below the bar to an empty load', () => {
    expect(plateLoad(15)).toEqual({ perSide: 0, plates: [], remainder: 0 });
  });
});

describe('dotsScore', () => {
  it('is positive and increases with the lifted total', () => {
    const base = dotsScore('male', 80, 500);
    expect(base).toBeGreaterThan(0);
    expect(dotsScore('male', 80, 600)).toBeGreaterThan(base);
  });

  it('uses sex-specific coefficients', () => {
    expect(dotsScore('female', 80, 500)).not.toBe(dotsScore('male', 80, 500));
  });
});
