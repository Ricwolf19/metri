import type { Equipment, ExerciseCategory } from '@/db/schema';

import type { MuscleHead } from './muscles';

/**
 * Built-in exercise catalog: the movements the app teaches and programs with —
 * a curated library plus the support movements the preset programs prescribe.
 * Ids are reused from the pre-v4 catalog wherever the movement matches, so
 * logged history keeps its meaning; anything else from the old list is
 * demoted/deleted by `migrateLegacyExercises` (seed v4).
 *
 * Names here are the EN base; ES/EN display names and technique cues live in
 * `exercise-content.ts` (content module, not i18n dictionaries).
 */

export type ExerciseSeed = {
  id: string;
  name: string;
  category: ExerciseCategory;
  primaryMuscles: MuscleHead[];
  secondaryMuscles: MuscleHead[];
  equipment: Equipment;
};

export const EXERCISE_SEEDS: ExerciseSeed[] = [
  // ── Core library (curated technique cues in exercise-content.ts) ─────────
  {
    id: 'barbell-back-squat',
    name: 'Squat',
    category: 'legs',
    primaryMuscles: ['quads', 'glutes'],
    secondaryMuscles: ['hamstrings', 'abs'],
    equipment: 'barbell',
  },
  {
    id: 'barbell-bench-press',
    name: 'Bench Press',
    category: 'chest',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'front_delts'],
    equipment: 'barbell',
  },
  {
    id: 'incline-bench-press',
    name: 'Incline Bench Press',
    category: 'chest',
    primaryMuscles: ['upper_chest'],
    secondaryMuscles: ['triceps', 'front_delts'],
    equipment: 'barbell',
  },
  {
    id: 'close-grip-bench-press',
    name: 'Close-Grip Bench Press',
    category: 'arms',
    primaryMuscles: ['triceps'],
    secondaryMuscles: ['chest', 'front_delts'],
    equipment: 'barbell',
  },
  {
    id: 'deadlift',
    name: 'Conventional Deadlift',
    category: 'back',
    primaryMuscles: ['lower_back', 'glutes', 'hamstrings'],
    secondaryMuscles: ['traps', 'forearms'],
    equipment: 'barbell',
  },
  {
    id: 'sumo-deadlift',
    name: 'Sumo Deadlift',
    category: 'back',
    primaryMuscles: ['glutes', 'hamstrings'],
    secondaryMuscles: ['lower_back', 'quads'],
    equipment: 'barbell',
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    category: 'legs',
    primaryMuscles: ['hamstrings', 'glutes'],
    secondaryMuscles: ['lower_back'],
    equipment: 'barbell',
  },
  {
    id: 'overhead-press',
    name: 'Barbell Overhead Press',
    category: 'shoulders',
    primaryMuscles: ['front_delts'],
    secondaryMuscles: ['triceps', 'upper_chest'],
    equipment: 'barbell',
  },
  {
    id: 'seated-dumbbell-press',
    name: 'Dumbbell Overhead Press',
    category: 'shoulders',
    primaryMuscles: ['front_delts'],
    secondaryMuscles: ['triceps'],
    equipment: 'dumbbell',
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    category: 'back',
    primaryMuscles: ['lats'],
    secondaryMuscles: ['biceps', 'rear_delts'],
    equipment: 'cable',
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    category: 'legs',
    primaryMuscles: ['quads', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    equipment: 'machine',
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    category: 'legs',
    primaryMuscles: ['quads'],
    secondaryMuscles: [],
    equipment: 'machine',
  },
  {
    id: 'lying-leg-curl',
    name: 'Leg Curl',
    category: 'legs',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: [],
    equipment: 'machine',
  },
  {
    id: 'barbell-curl',
    name: 'Barbell Bicep Curl',
    category: 'arms',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    equipment: 'barbell',
  },
  // Deliberately ships without technique cues (none curated yet).
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    category: 'arms',
    primaryMuscles: ['biceps', 'forearms'],
    secondaryMuscles: [],
    equipment: 'dumbbell',
  },
  {
    id: 'skullcrusher',
    name: 'Dumbbell Skullcrusher',
    category: 'arms',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: 'dumbbell',
  },
  {
    id: 'back-extension',
    name: 'Back Extension',
    category: 'back',
    primaryMuscles: ['lower_back'],
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: 'bodyweight',
  },
  {
    id: 'crunch',
    name: 'Crunch',
    category: 'core',
    primaryMuscles: ['abs'],
    secondaryMuscles: [],
    equipment: 'bodyweight',
  },
  {
    id: 'standing-calf-raise',
    name: 'Calf Raise',
    category: 'legs',
    primaryMuscles: ['calves'],
    secondaryMuscles: [],
    equipment: 'machine',
  },

  // ── Support movements used by the preset programs ────────────────────────
  {
    id: 'machine-chest-press',
    name: 'Machine Chest Press',
    category: 'chest',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps'],
    equipment: 'machine',
  },
  {
    id: 'dumbbell-fly',
    name: 'Dumbbell Fly',
    category: 'chest',
    primaryMuscles: ['chest'],
    secondaryMuscles: [],
    equipment: 'dumbbell',
  },
  {
    id: 'cable-fly',
    name: 'Cable Fly',
    category: 'chest',
    primaryMuscles: ['chest'],
    secondaryMuscles: [],
    equipment: 'cable',
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    category: 'shoulders',
    primaryMuscles: ['side_delts'],
    secondaryMuscles: [],
    equipment: 'dumbbell',
  },
  {
    id: 'cable-lateral-raise',
    name: 'Cable Lateral Raise',
    category: 'shoulders',
    primaryMuscles: ['side_delts'],
    secondaryMuscles: [],
    equipment: 'cable',
  },
  {
    id: 'rear-delt-fly',
    name: 'Rear Delt Fly',
    category: 'shoulders',
    primaryMuscles: ['rear_delts'],
    secondaryMuscles: [],
    equipment: 'dumbbell',
  },
  {
    id: 'machine-shoulder-press',
    name: 'Machine Shoulder Press',
    category: 'shoulders',
    primaryMuscles: ['front_delts'],
    secondaryMuscles: ['triceps'],
    equipment: 'machine',
  },
  {
    id: 'pullover',
    name: 'Pullover',
    category: 'back',
    primaryMuscles: ['lats'],
    secondaryMuscles: ['chest'],
    equipment: 'dumbbell',
  },
  {
    id: 'machine-row',
    name: 'Machine Row',
    category: 'back',
    primaryMuscles: ['lats', 'mid_back'],
    secondaryMuscles: ['biceps'],
    equipment: 'machine',
  },
  {
    id: 'dumbbell-row',
    name: 'Dumbbell Row',
    category: 'back',
    primaryMuscles: ['lats', 'mid_back'],
    secondaryMuscles: ['biceps'],
    equipment: 'dumbbell',
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    category: 'back',
    primaryMuscles: ['mid_back', 'lats'],
    secondaryMuscles: ['biceps'],
    equipment: 'cable',
  },
  {
    id: 't-bar-row',
    name: 'T-Bar Row',
    category: 'back',
    primaryMuscles: ['mid_back', 'lats'],
    secondaryMuscles: ['biceps'],
    equipment: 'barbell',
  },
  {
    id: 'hack-squat',
    name: 'Hack Squat',
    category: 'legs',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes'],
    equipment: 'machine',
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    category: 'legs',
    primaryMuscles: ['quads', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    equipment: 'dumbbell',
  },
  {
    id: 'preacher-curl',
    name: 'Preacher Curl',
    category: 'arms',
    primaryMuscles: ['biceps'],
    secondaryMuscles: [],
    equipment: 'barbell',
  },
  {
    id: 'spider-curl',
    name: 'Spider Curl',
    category: 'arms',
    primaryMuscles: ['biceps'],
    secondaryMuscles: [],
    equipment: 'dumbbell',
  },
  {
    id: 'incline-dumbbell-curl',
    name: 'Incline Dumbbell Curl',
    category: 'arms',
    primaryMuscles: ['biceps'],
    secondaryMuscles: [],
    equipment: 'dumbbell',
  },
  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    category: 'arms',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: 'cable',
  },
  {
    id: 'overhead-tricep-extension',
    name: 'Overhead Tricep Extension',
    category: 'arms',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: 'dumbbell',
  },
  {
    id: 'cable-overhead-extension',
    name: 'Cable Overhead Extension',
    category: 'arms',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: 'cable',
  },
  {
    id: 'french-press',
    name: 'French Press',
    category: 'arms',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: 'barbell',
  },
  {
    id: 'cable-kickback',
    name: 'Cable Kickback',
    category: 'arms',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: 'cable',
  },
];
