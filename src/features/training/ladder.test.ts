import { describe, expect, it } from 'vitest';

import { ladderAt, ladderValues, parseLadder, rungOf, stepAlong } from './ladder';

describe('ladder', () => {
  const stack = { start: 10, step: 5 };
  // A stack whose plates weigh 10 from the 50 on.
  const jumped = { start: 0, step: 5, jumps: [{ from: 50, step: 10 }] };

  it('walks one step when nothing changes', () => {
    expect(ladderValues(stack, 30, 99)).toEqual([10, 15, 20, 25, 30]);
    expect(ladderAt(stack, 6)).toBe(40);
    expect(ladderValues({ start: 0, step: 1.25 }, 99, 4)).toEqual([0, 1.25, 2.5, 3.75]);
  });

  it('changes step at a jump, from that value on', () => {
    expect(ladderValues(jumped, 80, 99)).toEqual([
      0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80,
    ]);
    expect(ladderAt(jumped, 11)).toBe(60);
  });

  it('reads the jumps in order and ignores the ones that mean nothing', () => {
    const rack = {
      start: 2.5,
      step: 2.5,
      jumps: [
        { from: 50, step: 5 },
        { from: 10, step: 0 },
        { from: 20, step: 5 },
      ],
    };
    expect(ladderValues(rack, 40, 99)).toEqual([
      2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 25, 30, 35, 40,
    ]);
  });

  it('offers nothing without a step', () => {
    expect(ladderValues({ start: 10, step: 0 }, 100, 10)).toEqual([]);
  });

  // 10 lb a plate from 100 lb, stored in kg: the walk must still land on the jump.
  it('takes a jump a converted step reaches a hair short', () => {
    const lbInKg = 0.45359237;
    const kg = { start: 0, step: 5 * lbInKg, jumps: [{ from: 100 * lbInKg, step: 10 * lbInKg }] };
    expect(ladderAt(kg, 21) / lbInKg).toBeCloseTo(110, 1);
  });

  it('finds a value on its rung, and none between two', () => {
    const values = ladderValues(jumped, 80, 99);
    expect(rungOf(values, 60)).toBe(11);
    expect(rungOf(values, 55)).toBeNull();
    expect(rungOf(values, null)).toBeNull();
  });

  it('steps ± at least one rung, else to the rung nearest the jump asked', () => {
    const values = ladderValues(jumped, 80, 99);
    expect(stepAlong(values, 45, 0.5)).toBe(50);
    expect(stepAlong(values, 50, 2.5)).toBe(60);
    expect(stepAlong(values, 50, 20)).toBe(70);
    expect(stepAlong(values, 60, -1)).toBe(50);
    expect(stepAlong(values, 0, -5)).toBe(0);
    expect(stepAlong(values, 80, 5)).toBe(80);
  });
});

describe('parseLadder', () => {
  it('reads a stored ladder and drops what it cannot use', () => {
    expect(
      parseLadder({ start: 2.5, step: 2.5, jumps: [{ from: 50, step: 5 }, { from: 'x' }, null] }),
    ).toEqual({ start: 2.5, step: 2.5, jumps: [{ from: 50, step: 5 }] });
  });

  it('refuses a shape with no usable step', () => {
    expect(parseLadder(null)).toBeNull();
    expect(parseLadder({ start: 0, step: 0 })).toBeNull();
    expect(parseLadder({ start: -1, step: 5 })).toBeNull();
    expect(parseLadder('rack')).toBeNull();
  });
});
