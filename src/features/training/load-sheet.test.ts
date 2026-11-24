import { describe, expect, it } from 'vitest';

import { seedLoadSheet, sheetPins, untouchedStack } from './load-sheet';
import { DEFAULT_DUMBBELL_RACK } from './plate-math';

const base = {
  unit: 'kg' as const,
  rack: DEFAULT_DUMBBELL_RACK.kg,
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

  it('opens a dumbbell on the row as ONE dumbbell, with no hand count to choose', () => {
    const seed = seedLoadSheet({
      ...base,
      equipment: 'dumbbell',
      initialWeight: '22.5',
      initialLoad: { kind: 'dumbbell', perHandKg: 22.5, hands: 1 },
    });
    expect(seed).toMatchObject({ mode: 'dumbbell', perHandText: '22.5' });
    // The count is the exercise's (`defaultHands`), never a field of the sheet.
    expect(seed).not.toHaveProperty('hands');
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

  it('opens a stack with its plate changes and finds a pin past them', () => {
    const stack = {
      kind: 'machine' as const,
      baseKg: 0,
      incrementKg: 5,
      steps: 0,
      jumps: [{ fromKg: 50, incrementKg: 10 }],
    };
    const seed = seedLoadSheet({
      ...base,
      equipment: 'cable',
      initialWeight: '70',
      initialLoad: stack,
    });
    expect(seed).toMatchObject({ jumps: [{ fromText: '50', stepText: '10' }], step: 12 });
    expect(sheetPins(seed, 'kg').slice(9, 13)).toEqual([45, 50, 60, 70]);
  });

  // A kg stack opened in a lb gym: its fields read 11.02 lb plates, and walking
  // them offered a 121.22 pin the stack does not have and lost the row's pin.
  it('keeps a saved stack exact in the other unit until its fields change', () => {
    const stack = {
      kind: 'machine' as const,
      baseKg: 0,
      incrementKg: 5,
      steps: 0,
      jumps: [{ fromKg: 50, incrementKg: 10 }],
    };
    const seed = seedLoadSheet({
      ...base,
      unit: 'lb',
      equipment: 'cable',
      initialWeight: '132.28',
      initialLoad: stack,
    });
    expect(seed).toMatchObject({ incText: '11.02', step: 11 });
    const kept = untouchedStack(seed, seed, stack);
    expect(kept).toBe(stack);
    expect(sheetPins(seed, 'lb', kept).slice(9, 13)).toEqual([99.21, 110.23, 132.28, 154.32]);
    // Typed fields describe a new stack, walked as typed.
    expect(untouchedStack({ ...seed, incText: '10' }, seed, stack)).toBeNull();
  });

  it('carries the rack into the dumbbell fields', () => {
    const seed = seedLoadSheet({
      ...base,
      equipment: 'dumbbell',
      initialWeight: '',
      initialLoad: null,
    });
    expect(seed).toMatchObject({
      rackStartText: '2.5',
      rackStepText: '2.5',
      rackJumps: [{ fromText: '50', stepText: '5' }],
    });
  });
});
