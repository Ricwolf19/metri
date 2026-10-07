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

  // v10: each kit is its own row because the equipment decides how the weight
  // is entered — bar + plates, dumbbells per hand, a machine stack.
  it('offers every kit of the bench press from any of them', () => {
    expect(equipmentVariants('barbell-bench-press')).toEqual([
      'dumbbell-bench-press',
      'smith-machine-bench-press',
      'machine-chest-press',
    ]);
    expect(equipmentVariants('smith-machine-bench-press')).toEqual([
      'barbell-bench-press',
      'dumbbell-bench-press',
      'machine-chest-press',
    ]);
  });

  it('keeps a variant on the equipment its row declares', () => {
    const byId = new Map(EXERCISE_SEEDS.map((e) => [e.id, e]));
    expect(byId.get('dumbbell-bench-press')?.equipment).toBe('dumbbell');
    expect(byId.get('smith-machine-bench-press')?.equipment).toBe('machine');
    expect(byId.get('pull-up')?.equipment).toBe('bodyweight');
    expect(byId.get('walking-lunge')?.unilateral).toBe(true);
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
    ).toEqual([
      'machine-row',
      'seated-cable-row',
      't-bar-row',
      'barbell-row',
      'chest-supported-row',
    ]);
  });

  it('never offers the exercise already on the card', () => {
    const options = swapOptions({
      exerciseId: 'goblet-squat',
      originalExerciseId: 'barbell-back-squat',
      alternativeExerciseIds: ['leg-press'],
    });
    expect(options).not.toContain('goblet-squat');
    expect(options).toEqual([
      'barbell-back-squat',
      'leg-press',
      'smith-machine-squat',
      'hack-squat',
    ]);
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
