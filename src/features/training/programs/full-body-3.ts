import { ACCESSORY_REST, COMPOUND_REST, SECONDARY_REST, type ProgramSeed } from './types';

/**
 * Full Body 3× — a beginner 4-week block training the whole body three times a
 * week. Compound-led, moderate volume, RIR 3→1 across the block (the shared
 * ramp), so newcomers build the main lifts before adding isolation work.
 */
export const FULL_BODY_3: ProgramSeed = {
  id: 'fb-3',
  name: 'Full Body 3×',
  description:
    'A beginner-friendly full-body program: three sessions a week built around the main compound lifts, with a simple weekly RIR progression. Ideal for your first months of structured training.',
  durationWeeks: 4,
  difficulty: 'beginner',
  goal: 'strength',
  routines: [
    {
      slug: 'foundation',
      name: 'Foundation',
      orderIndex: 1,
      days: [
        {
          slug: 'a',
          name: 'Full Body A',
          focusMuscles: ['quads', 'chest', 'back'],
          exercises: [
            {
              exerciseId: 'barbell-back-squat',
              sets: 3,
              reps: 6,
              restSeconds: COMPOUND_REST,
              badges: ['TECHNIQUE FIRST'],
            },
            { exerciseId: 'barbell-bench-press', sets: 3, reps: 6, restSeconds: COMPOUND_REST },
            { exerciseId: 'barbell-row', sets: 3, reps: 8, restSeconds: SECONDARY_REST },
            { exerciseId: 'overhead-press', sets: 2, reps: 8, restSeconds: SECONDARY_REST },
            { exerciseId: 'plank', sets: 3, reps: 12, restSeconds: ACCESSORY_REST },
          ],
        },
        {
          slug: 'b',
          name: 'Full Body B',
          focusMuscles: ['hamstrings', 'back', 'shoulders'],
          exercises: [
            {
              exerciseId: 'romanian-deadlift',
              sets: 3,
              reps: 8,
              restSeconds: COMPOUND_REST,
              badges: ['NEUTRAL SPINE'],
            },
            {
              exerciseId: 'incline-dumbbell-press',
              sets: 3,
              reps: 10,
              restSeconds: SECONDARY_REST,
            },
            { exerciseId: 'lat-pulldown', sets: 3, reps: 10, restSeconds: SECONDARY_REST },
            { exerciseId: 'leg-press', sets: 3, reps: 12, restSeconds: SECONDARY_REST },
            { exerciseId: 'hanging-leg-raise', sets: 3, reps: 10, restSeconds: ACCESSORY_REST },
          ],
        },
        {
          slug: 'c',
          name: 'Full Body C',
          focusMuscles: ['quads', 'chest', 'shoulders'],
          exercises: [
            { exerciseId: 'front-squat', sets: 3, reps: 8, restSeconds: COMPOUND_REST },
            { exerciseId: 'dumbbell-bench-press', sets: 3, reps: 10, restSeconds: SECONDARY_REST },
            { exerciseId: 'seated-cable-row', sets: 3, reps: 10, restSeconds: SECONDARY_REST },
            { exerciseId: 'lateral-raise', sets: 3, reps: 12, restSeconds: ACCESSORY_REST },
            { exerciseId: 'standing-calf-raise', sets: 3, reps: 12, restSeconds: ACCESSORY_REST },
          ],
        },
      ],
    },
  ],
};
