import { describe, expect, it } from 'vitest';

import { EXERCISE_SEEDS } from './exercises.seed';
import { equipmentVariants, prefillSourceKey, swapOptions } from './variants';

describe('equipmentVariants', () => {
  it('offers the same movement on other kit, never the exercise itself', () => {
    expect(equipmentVariants('overhead-press')).toEqual([
      'seated-barbell-press',
      'seated-dumbbell-press',
      'machine-shoulder-press',
    ]);
    expect(equipmentVariants('my-custom-thing')).toEqual([]);
  });

  it('only names catalog exercises', () => {
    const ids = new Set(EXERCISE_SEEDS.map((e) => e.id));
    for (const id of ids) for (const v of equipmentVariants(id)) expect(ids).toContain(v);
  });
});

describe('swapOptions', () => {
  it('lists slot alternatives first, then variants, without duplicates', () => {
    expect(
      swapOptions({ exerciseId: 'lying-leg-curl', alternativeExerciseIds: ['leg-extension'] }),
    ).toEqual(['leg-extension', 'standing-leg-curl']);
  });

  it('offers the planned exercise back after a swap and hides the current one', () => {
    expect(
      swapOptions({
        exerciseId: 'dumbbell-row',
        originalExerciseId: 'machine-row',
        alternativeExerciseIds: [],
      }),
    ).toEqual(['machine-row', 'seated-cable-row', 't-bar-row']);
  });
});

describe('prefillSourceKey', () => {
  // The bug: prefill memoised per session kept the swapped-out exercise's loads.
  it('changes when a slot swaps to a variant', () => {
    const before = prefillSourceKey([{ slotId: 's1', exerciseId: 'machine-row' }]);
    const after = prefillSourceKey([{ slotId: 's1', exerciseId: 'dumbbell-row' }]);
    expect(after).not.toBe(before);
  });
});
