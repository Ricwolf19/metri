import { describe, expect, it } from 'vitest';

import { defaultRestFor } from './exercise-rest';
import { EXERCISE_SEEDS } from './exercises.seed';
import { PROGRAM_SEEDS } from './programs';

const exerciseById = new Map(EXERCISE_SEEDS.map((e) => [e.id, e]));

describe('defaultRestFor', () => {
  it('rests a deadlift as a main lift, not as the back extension it replaced', () => {
    expect(defaultRestFor(exerciseById.get('deadlift')!)).toBe(180);
    expect(defaultRestFor(exerciseById.get('back-extension')!)).toBe(120);
  });

  it('agrees with what the presets prescribe for every exercise they plan', () => {
    const disagreements = PROGRAM_SEEDS.flatMap((program) =>
      program.routines.flatMap((routine) =>
        routine.days.flatMap((day) =>
          day.exercises.flatMap((slot) => {
            const rest = defaultRestFor(exerciseById.get(slot.exerciseId)!);
            return rest === slot.restSeconds ? [] : [`${slot.exerciseId}: ${rest}`];
          }),
        ),
      ),
    );
    expect(disagreements).toEqual([]);
  });
});
