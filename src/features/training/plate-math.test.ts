import { describe, expect, it } from 'vitest';

import {
  barLabel,
  equivalentIn,
  fromDisplay,
  platesToSide,
  sideFromTotal,
  sideTextFromTotal,
  toDisplay,
  totalFromSide,
} from './plate-math';

describe('totalFromSide', () => {
  it('doubles one side and adds the bar', () => {
    expect(totalFromSide(60, 20)).toBe(140);
  });

  it('supports bar-less plate-loaded machines', () => {
    expect(totalFromSide(50, 0)).toBe(100);
  });

  it('never goes negative', () => {
    expect(totalFromSide(-10, 20)).toBe(0);
  });
});

describe('sideFromTotal', () => {
  it('is the inverse of totalFromSide', () => {
    expect(sideFromTotal(140, 20)).toBe(60);
    expect(totalFromSide(sideFromTotal(100, 0), 0)).toBe(100);
  });

  it('clamps at zero when the target is below the bar weight', () => {
    expect(sideFromTotal(10, 20)).toBe(0);
  });
});

describe('platesToSide', () => {
  it('sums the plates on one side', () => {
    expect(platesToSide([20, 20, 2.5])).toBe(42.5);
    expect(platesToSide([])).toBe(0);
  });
});

describe('unit conversion', () => {
  it('toDisplay/fromDisplay round-trip through lb', () => {
    const lb = toDisplay(60, 'lb');
    expect(lb).toBeCloseTo(132.28, 2);
    expect(fromDisplay(lb, 'lb')).toBeCloseTo(60, 2);
  });

  it('kg stays untouched by toDisplay', () => {
    expect(toDisplay(62.5, 'kg')).toBe(62.5);
  });

  it('equivalentIn shows the displayed value in the other unit', () => {
    expect(equivalentIn(100, 'kg')).toBe(220.5);
    expect(equivalentIn(220.5, 'lb')).toBe(100);
  });

  it('barLabel renders the bar in the active unit', () => {
    expect(barLabel({ id: 'bar-20', kg: 20 }, 'kg')).toBe('20');
    expect(barLabel({ id: 'bar-20', kg: 20 }, 'lb')).toBe('44.09');
    expect(barLabel({ id: 'bar-0', kg: 0 }, 'lb')).toBe('0');
  });
});

describe('sideTextFromTotal', () => {
  it('splits the row total into one side instead of treating it as a side', () => {
    // 100 kg on a 20 kg bar = 40 per side; seeding "100" as a side read 220.
    expect(sideTextFromTotal('100', 20, 'kg')).toBe('40');
  });

  it('works on a bar-less machine', () => {
    expect(sideTextFromTotal('90', 0, 'kg')).toBe('45');
  });

  it('leaves the field empty when there is nothing to split', () => {
    expect(sideTextFromTotal('', 20, 'kg')).toBe('');
    expect(sideTextFromTotal('abc', 20, 'kg')).toBe('');
    expect(sideTextFromTotal('15', 20, 'kg')).toBe('');
  });
});
