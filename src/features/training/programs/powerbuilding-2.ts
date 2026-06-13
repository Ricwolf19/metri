import type { IntensityType, ProgramDifficulty, ProgramGoal } from '@/db/schema';

/**
 * PowerBuilding 2.0 — a 12-week template (3 routines × 4 weeks) built from the
 * curated exercise library. Each slot defines a base set/rep scheme; the seed
 * runner expands it into four routine-relative `week_configs` using the shared
 * RIR progression below (the standard 3-4 → 2-3 → 1-2 → failure/deload ramp).
 *
 * Source: PowerBuilding 2.0 — Adrian Herrero Coach.
 */
export type SlotSeed = {
  exerciseId: string;
  sets: number;
  reps: number;
  restSeconds: number;
  notes?: string;
};

export type DaySeed = {
  /** Slug suffix, made unique per routine when seeded. */
  slug: string;
  name: string;
  focusMuscles: string[];
  exercises: SlotSeed[];
};

export type RoutineSeed = {
  slug: string;
  name: string;
  orderIndex: number;
  days: DaySeed[];
};

export type ProgramSeed = {
  id: string;
  name: string;
  description: string;
  durationWeeks: number;
  difficulty: ProgramDifficulty;
  goal: ProgramGoal;
  routines: RoutineSeed[];
};

/** Routine-relative week prescription. Week 4 is an intensification/test week. */
export type WeekStep = {
  rirMin: number | null;
  rirMax: number | null;
  toFailure: boolean;
  intensityType: IntensityType;
};

export const WEEK_PROGRESSION: WeekStep[] = [
  { rirMin: 3, rirMax: 4, toFailure: false, intensityType: 'rir' },
  { rirMin: 2, rirMax: 3, toFailure: false, intensityType: 'rir' },
  { rirMin: 1, rirMax: 2, toFailure: false, intensityType: 'rir' },
  { rirMin: 0, rirMax: 0, toFailure: true, intensityType: 'rir' },
];

const COMPOUND_REST = 180;
const ACCESSORY_REST = 90;

export const POWERBUILDING_2: ProgramSeed = {
  id: 'pb-2-0',
  name: 'PowerBuilding 2.0',
  description:
    'A 12-week powerbuilding program: a strength-and-size base, a hypertrophy block, and a strength peak. Three 4-week routines of Push / Pull / Legs.',
  durationWeeks: 12,
  difficulty: 'intermediate',
  goal: 'powerbuilding',
  routines: [
    {
      slug: 'base',
      name: 'Rutina 1 — Base',
      orderIndex: 1,
      days: [
        {
          slug: 'push',
          name: 'Push',
          focusMuscles: ['chest', 'shoulders', 'triceps'],
          exercises: [
            { exerciseId: 'barbell-bench-press', sets: 4, reps: 6, restSeconds: COMPOUND_REST },
            { exerciseId: 'overhead-press', sets: 3, reps: 8, restSeconds: COMPOUND_REST },
            {
              exerciseId: 'incline-dumbbell-press',
              sets: 3,
              reps: 10,
              restSeconds: ACCESSORY_REST,
            },
            { exerciseId: 'lateral-raise', sets: 3, reps: 12, restSeconds: ACCESSORY_REST },
            { exerciseId: 'tricep-pushdown', sets: 3, reps: 12, restSeconds: ACCESSORY_REST },
          ],
        },
        {
          slug: 'pull',
          name: 'Pull',
          focusMuscles: ['back', 'rear_delts', 'biceps'],
          exercises: [
            { exerciseId: 'deadlift', sets: 4, reps: 5, restSeconds: COMPOUND_REST },
            { exerciseId: 'barbell-row', sets: 4, reps: 8, restSeconds: COMPOUND_REST },
            { exerciseId: 'lat-pulldown', sets: 3, reps: 10, restSeconds: ACCESSORY_REST },
            { exerciseId: 'face-pull', sets: 3, reps: 15, restSeconds: ACCESSORY_REST },
            { exerciseId: 'barbell-curl', sets: 3, reps: 10, restSeconds: ACCESSORY_REST },
          ],
        },
        {
          slug: 'legs',
          name: 'Legs',
          focusMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
          exercises: [
            { exerciseId: 'barbell-back-squat', sets: 4, reps: 6, restSeconds: COMPOUND_REST },
            { exerciseId: 'romanian-deadlift', sets: 3, reps: 8, restSeconds: COMPOUND_REST },
            { exerciseId: 'leg-press', sets: 3, reps: 10, restSeconds: ACCESSORY_REST },
            { exerciseId: 'lying-leg-curl', sets: 3, reps: 12, restSeconds: ACCESSORY_REST },
            { exerciseId: 'standing-calf-raise', sets: 4, reps: 12, restSeconds: ACCESSORY_REST },
          ],
        },
      ],
    },
    {
      slug: 'build',
      name: 'Rutina 2 — Build',
      orderIndex: 2,
      days: [
        {
          slug: 'push',
          name: 'Push',
          focusMuscles: ['chest', 'shoulders', 'triceps'],
          exercises: [
            { exerciseId: 'incline-dumbbell-press', sets: 4, reps: 10, restSeconds: COMPOUND_REST },
            { exerciseId: 'machine-chest-press', sets: 3, reps: 12, restSeconds: ACCESSORY_REST },
            { exerciseId: 'seated-dumbbell-press', sets: 3, reps: 10, restSeconds: ACCESSORY_REST },
            { exerciseId: 'cable-fly', sets: 3, reps: 15, restSeconds: ACCESSORY_REST },
            {
              exerciseId: 'overhead-tricep-extension',
              sets: 3,
              reps: 12,
              restSeconds: ACCESSORY_REST,
            },
          ],
        },
        {
          slug: 'pull',
          name: 'Pull',
          focusMuscles: ['back', 'rear_delts', 'biceps'],
          exercises: [
            { exerciseId: 'pull-up', sets: 4, reps: 8, restSeconds: COMPOUND_REST },
            { exerciseId: 'seated-cable-row', sets: 4, reps: 12, restSeconds: ACCESSORY_REST },
            { exerciseId: 'machine-row', sets: 3, reps: 12, restSeconds: ACCESSORY_REST },
            { exerciseId: 'rear-delt-fly', sets: 3, reps: 15, restSeconds: ACCESSORY_REST },
            { exerciseId: 'hammer-curl', sets: 3, reps: 12, restSeconds: ACCESSORY_REST },
          ],
        },
        {
          slug: 'legs',
          name: 'Legs',
          focusMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
          exercises: [
            { exerciseId: 'front-squat', sets: 4, reps: 8, restSeconds: COMPOUND_REST },
            { exerciseId: 'bulgarian-split-squat', sets: 3, reps: 10, restSeconds: ACCESSORY_REST },
            { exerciseId: 'leg-extension', sets: 3, reps: 15, restSeconds: ACCESSORY_REST },
            { exerciseId: 'lying-leg-curl', sets: 3, reps: 12, restSeconds: ACCESSORY_REST },
            { exerciseId: 'standing-calf-raise', sets: 4, reps: 15, restSeconds: ACCESSORY_REST },
          ],
        },
      ],
    },
    {
      slug: 'peak',
      name: 'Rutina 3 — Peak',
      orderIndex: 3,
      days: [
        {
          slug: 'push',
          name: 'Push',
          focusMuscles: ['chest', 'shoulders', 'triceps'],
          exercises: [
            { exerciseId: 'barbell-bench-press', sets: 5, reps: 4, restSeconds: COMPOUND_REST },
            { exerciseId: 'close-grip-bench-press', sets: 3, reps: 6, restSeconds: COMPOUND_REST },
            { exerciseId: 'overhead-press', sets: 4, reps: 5, restSeconds: COMPOUND_REST },
            { exerciseId: 'lateral-raise', sets: 3, reps: 12, restSeconds: ACCESSORY_REST },
            { exerciseId: 'skullcrusher', sets: 3, reps: 8, restSeconds: ACCESSORY_REST },
          ],
        },
        {
          slug: 'pull',
          name: 'Pull',
          focusMuscles: ['back', 'rear_delts', 'biceps'],
          exercises: [
            { exerciseId: 'deadlift', sets: 4, reps: 3, restSeconds: COMPOUND_REST },
            { exerciseId: 'barbell-row', sets: 4, reps: 6, restSeconds: COMPOUND_REST },
            { exerciseId: 'pull-up', sets: 3, reps: 6, restSeconds: COMPOUND_REST },
            { exerciseId: 'face-pull', sets: 3, reps: 15, restSeconds: ACCESSORY_REST },
            { exerciseId: 'preacher-curl', sets: 3, reps: 10, restSeconds: ACCESSORY_REST },
          ],
        },
        {
          slug: 'legs',
          name: 'Legs',
          focusMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
          exercises: [
            { exerciseId: 'barbell-back-squat', sets: 5, reps: 4, restSeconds: COMPOUND_REST },
            { exerciseId: 'romanian-deadlift', sets: 3, reps: 6, restSeconds: COMPOUND_REST },
            { exerciseId: 'hip-thrust', sets: 3, reps: 8, restSeconds: ACCESSORY_REST },
            { exerciseId: 'leg-extension', sets: 3, reps: 12, restSeconds: ACCESSORY_REST },
            { exerciseId: 'standing-calf-raise', sets: 4, reps: 12, restSeconds: ACCESSORY_REST },
          ],
        },
      ],
    },
  ],
};

export const PROGRAM_SEEDS: ProgramSeed[] = [POWERBUILDING_2];
