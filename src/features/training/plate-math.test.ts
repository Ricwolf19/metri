import { describe, expect, it } from 'vitest';

import {
  addPlate,
  BARS,
  barInUnit,
  barLabel,
  equivalentIn,
  plateOptions,
  platesToSide,
  removePlate,
  sideFromTotal,
  sideTextFromTotal,
  totalFromSide,
} from './plate-math';

const bar = (kg: number) => BARS.find((b) => b.kg === kg)!;

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

  it('trims float noise from decimal plates', () => {
    expect(platesToSide([0.5, 0.5, 0.5, 1.25])).toBe(2.75);
  });
});

describe('addPlate / removePlate', () => {
  it('stacks the same plate twice (2 × 20 per side)', () => {
    const side = addPlate(addPlate([], 20), 20);
    expect(side).toEqual([20, 20]);
    expect(platesToSide(side)).toBe(40);
  });

  it('removes one instance, not every plate of that size', () => {
    expect(removePlate([20, 20], 20)).toEqual([20]);
  });

  it('keeps the side sorted largest first', () => {
    expect(addPlate(addPlate(addPlate([], 5), 25), 10)).toEqual([25, 10, 5]);
  });

  it('ignores removing a plate that is not loaded', () => {
    const side = [20];
    expect(removePlate(side, 5)).toBe(side);
  });
});

describe('plateOptions', () => {
  it('offers real lb plates in lb, not converted kg ones', () => {
    expect(plateOptions('lb')).toEqual([45, 35, 25, 10, 5, 2.5]);
    expect(plateOptions('kg')).toContain(1.25);
  });
});

describe('unit display', () => {
  it('equivalentIn shows the displayed value in the other unit', () => {
    expect(equivalentIn(100, 'kg')).toBe(220.5);
    expect(equivalentIn(220.5, 'lb')).toBe(100);
  });

  it('barLabel renders the bar in the active unit', () => {
    expect(barLabel(bar(20), 'kg')).toBe('20');
    expect(barLabel(bar(20), 'lb')).toBe('44.09');
    expect(barLabel(bar(0), 'lb')).toBe('0');
  });
});

describe('sideTextFromTotal', () => {
  it('splits the row total into one side instead of treating it as a side', () => {
    // 100 kg on a 20 kg bar = 40 per side; seeding "100" as a side read 220.
    expect(sideTextFromTotal('100', 20)).toBe('40');
  });

  it('works on a bar-less machine', () => {
    expect(sideTextFromTotal('90', 0)).toBe('45');
  });

  it('leaves the field empty when there is nothing to split', () => {
    expect(sideTextFromTotal('', 20)).toBe('');
    expect(sideTextFromTotal('abc', 20)).toBe('');
    expect(sideTextFromTotal('15', 20)).toBe('');
  });
});

/**
 * An untouched open → Apply must hand back the exact total it opened on. Going
 * through kg and 2-decimal rounding returned 22.76 for 22.75 kg, 224.99 for
 * 225 lb and 44.99 for 45 lb.
 */
describe('open → Apply round-trip', () => {
  const cases: { unit: 'kg' | 'lb'; step: number; max: number }[] = [
    { unit: 'kg', step: 0.25, max: 400 },
    { unit: 'lb', step: 0.5, max: 900 },
  ];

  for (const { unit, step, max } of cases) {
    for (const kg of [20, 15, 0]) {
      it(`${unit} totals in ${step} steps on a ${kg} kg bar`, () => {
        const b = barInUnit(bar(kg), unit);
        for (let i = 1; i * step <= max; i++) {
          const total = i * step;
          if (total <= b) continue;
          const side = Number(sideTextFromTotal(String(total), b));
          expect(String(totalFromSide(side, b))).toBe(String(total));
        }
      });
    }
  }

  it('reproduces the field reports exactly', () => {
    const kgBar = barInUnit(bar(20), 'kg');
    const lbBar = barInUnit(bar(20), 'lb');
    const apply = (text: string, b: number) =>
      String(totalFromSide(Number(sideTextFromTotal(text, b)), b));
    expect(apply('22.75', kgBar)).toBe('22.75');
    expect(apply('225', lbBar)).toBe('225');
    expect(apply('45', lbBar)).toBe('45');
  });
});
