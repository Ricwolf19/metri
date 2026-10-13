import { describe, expect, it } from 'vitest';

import { clampRmTestWeek, fromKgHalf, isRmTestWeek } from './progression';

describe('fromKgHalf', () => {
  it.each([
    [62.26, 'kg', 62.5],
    [62.74, 'kg', 62.5],
    [62.76, 'kg', 63],
    [62.24, 'kg', 62],
    [60, 'lb', 132.5],
  ] as const)('%s kg in %s reads %s', (kg, unit, shown) => {
    expect(fromKgHalf(kg, unit)).toBe(shown);
  });
});

describe('RM test week', () => {
  it('matches only the routine-relative week the routine marks', () => {
    expect(isRmTestWeek({ rmTestWeek: 4 }, 4)).toBe(true);
    expect(isRmTestWeek({ rmTestWeek: 4 }, 3)).toBe(false);
    expect(isRmTestWeek({ rmTestWeek: null }, 1)).toBe(false);
    expect(isRmTestWeek(null, 1)).toBe(false);
  });

  it('drops a test week a shortened phase no longer reaches', () => {
    expect(clampRmTestWeek(4, 4)).toBe(4);
    expect(clampRmTestWeek(4, 3)).toBeNull();
    expect(clampRmTestWeek(0, 4)).toBeNull();
    expect(clampRmTestWeek(null, 4)).toBeNull();
  });
});
