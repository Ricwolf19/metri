import { ACCESSORY_REST, COMPOUND_REST, SECONDARY_REST, type ProgramSeed } from './types';

/**
 * Upper / Lower 4× — an intermediate 4-week block over four sessions a week
 * (Upper A, Lower A, Upper B, Lower B). Compounds are prescribed in rep ranges
 * (`repsMax`) so you pick a load you can keep in the window as the RIR ramp
 * tightens week to week — hypertrophy-biased with a strength base.
 */
export const UPPER_LOWER_4: ProgramSeed = {
  id: 'ul-4',
  name: 'Upper / Lower 4×',
  description:
    'An intermediate upper/lower split across four sessions a week. Compounds use rep ranges and a weekly RIR progression to drive hypertrophy while keeping the main lifts strong.',
  durationWeeks: 4,
  difficulty: 'intermediate',
  goal: 'hypertrophy',
  routines: [
    {
      slug: 'block',
      name: 'Block',
      orderIndex: 1,
      days: [
        {
          slug: 'upper-a',
          name: 'Upper A',
          focusMuscles: ['chest', 'back', 'shoulders'],
          exercises: [
            {
              exerciseId: 'barbell-bench-press',
              sets: 4,
              reps: 6,
              repsMax: 8,
              restSeconds: COMPOUND_REST,
            },
            { exerciseId: 'barbell-row', sets: 4, reps: 6, repsMax: 8, restSeconds: COMPOUND_REST },
            {
              exerciseId: 'overhead-press',
              sets: 3,
              reps: 8,
              repsMax: 10,
              restSeconds: SECONDARY_REST,
            },
            {
              exerciseId: 'lat-pulldown',
              sets: 3,
              reps: 10,
              repsMax: 12,
              restSeconds: SECONDARY_REST,
            },
            {
              exerciseId: 'dumbbell-curl',
              sets: 3,
              reps: 10,
              repsMax: 12,
              restSeconds: ACCESSORY_REST,
            },
            {
              exerciseId: 'tricep-pushdown',
              sets: 3,
              reps: 10,
              repsMax: 12,
              restSeconds: ACCESSORY_REST,
            },
          ],
        },
        {
          slug: 'lower-a',
          name: 'Lower A',
          focusMuscles: ['quads', 'hamstrings', 'calves'],
          exercises: [
            {
              exerciseId: 'barbell-back-squat',
              sets: 4,
              reps: 6,
              repsMax: 8,
              restSeconds: COMPOUND_REST,
            },
            {
              exerciseId: 'romanian-deadlift',
              sets: 3,
              reps: 8,
              repsMax: 10,
              restSeconds: COMPOUND_REST,
            },
            {
              exerciseId: 'leg-press',
              sets: 3,
              reps: 10,
              repsMax: 12,
              restSeconds: SECONDARY_REST,
            },
            {
              exerciseId: 'lying-leg-curl',
              sets: 3,
              reps: 10,
              repsMax: 12,
              restSeconds: ACCESSORY_REST,
            },
            {
              exerciseId: 'standing-calf-raise',
              sets: 4,
              reps: 12,
              repsMax: 15,
              restSeconds: ACCESSORY_REST,
            },
          ],
        },
        {
          slug: 'upper-b',
          name: 'Upper B',
          focusMuscles: ['chest', 'back', 'arms'],
          exercises: [
            {
              exerciseId: 'incline-dumbbell-press',
              sets: 4,
              reps: 8,
              repsMax: 10,
              restSeconds: SECONDARY_REST,
            },
            {
              exerciseId: 'seated-cable-row',
              sets: 4,
              reps: 8,
              repsMax: 10,
              restSeconds: SECONDARY_REST,
            },
            {
              exerciseId: 'lateral-raise',
              sets: 3,
              reps: 12,
              repsMax: 15,
              restSeconds: ACCESSORY_REST,
            },
            { exerciseId: 'chest-dip', sets: 3, reps: 8, repsMax: 12, restSeconds: SECONDARY_REST },
            {
              exerciseId: 'hammer-curl',
              sets: 3,
              reps: 10,
              repsMax: 12,
              restSeconds: ACCESSORY_REST,
            },
            {
              exerciseId: 'skullcrusher',
              sets: 3,
              reps: 10,
              repsMax: 12,
              restSeconds: ACCESSORY_REST,
              badges: ['ELBOWS IN'],
            },
          ],
        },
        {
          slug: 'lower-b',
          name: 'Lower B',
          focusMuscles: ['hamstrings', 'quads', 'glutes'],
          exercises: [
            {
              exerciseId: 'deadlift',
              sets: 3,
              reps: 5,
              repsMax: 6,
              restSeconds: COMPOUND_REST,
              badges: ['BRACE HARD'],
            },
            {
              exerciseId: 'front-squat',
              sets: 3,
              reps: 8,
              repsMax: 10,
              restSeconds: COMPOUND_REST,
            },
            {
              exerciseId: 'bulgarian-split-squat',
              sets: 3,
              reps: 10,
              repsMax: 12,
              restSeconds: SECONDARY_REST,
            },
            {
              exerciseId: 'leg-extension',
              sets: 3,
              reps: 12,
              repsMax: 15,
              restSeconds: ACCESSORY_REST,
            },
            {
              exerciseId: 'hanging-leg-raise',
              sets: 3,
              reps: 12,
              repsMax: 15,
              restSeconds: ACCESSORY_REST,
            },
          ],
        },
      ],
    },
  ],
};
