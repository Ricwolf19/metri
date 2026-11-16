import { describe, expect, it } from 'vitest';

import { seedLoadSheet } from './load-sheet';

const base = {
  unit: 'kg' as const,
  unilateral: false,
  oneDumbbell: false,
};

describe('weight sheet seed', () => {
  it('keeps the saved plates while the row still adds up to them', () => {
    const seed = seedLoadSheet({
      ...base,
      equipment: 'barbell',
      initialWeight: '100',
      initialLoad: { kind: 'barbell', barKg: 20, platesKg: [20, 20] },
    });
    expect(seed).toMatchObject({ mode: 'barbell', barId: 'bar-20', plates: [20, 20], sides: 2 });
  });

  it('splits a row that moved off the saved plates over the same bar', () => {
    const seed = seedLoadSheet({
      ...base,
      equipment: 'barbell',
      initialWeight: '60',
      initialLoad: { kind: 'barbell', barKg: 20, platesKg: [20, 20] },
    });
    expect(seed.barId).toBe('bar-20');
    expect(seed.plates.reduce((a, b) => a + b, 0)).toBe(20);
  });

  it('opens a dumbbell on the row as ONE dumbbell, hands from the saved detail', () => {
    const seed = seedLoadSheet({
      ...base,
      equipment: 'dumbbell',
      initialWeight: '22.5',
      initialLoad: { kind: 'dumbbell', perHandKg: 22.5, hands: 1 },
    });
    expect(seed).toMatchObject({ mode: 'dumbbell', perHandText: '22.5', hands: 1 });
    expect(
      seedLoadSheet({ ...base, equipment: 'dumbbell', initialWeight: '20', initialLoad: null })
        .hands,
    ).toBe(2);
    expect(
      seedLoadSheet({
        ...base,
        oneDumbbell: true,
        equipment: 'dumbbell',
        initialWeight: '20',
        initialLoad: null,
      }).hands,
    ).toBe(1);
  });

  it('puts a stack row on its pin, and none when it sits between pins', () => {
    const stack = { kind: 'machine' as const, baseKg: 5, incrementKg: 5, steps: 3 };
    const onPin = seedLoadSheet({
      ...base,
      equipment: 'cable',
      initialWeight: '35',
      initialLoad: stack,
    });
    expect(onPin).toMatchObject({ mode: 'machine', baseText: '5', incText: '5', step: 6 });
    const between = seedLoadSheet({
      ...base,
      equipment: 'cable',
      initialWeight: '37',
      initialLoad: stack,
    });
    expect(between.step).toBeNull();
  });
});
