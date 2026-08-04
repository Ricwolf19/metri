import type { IntensityType, ProgramDifficulty, ProgramGoal } from '@/db/schema';

/**
 * Shared shape for a seeded program template. A program is a list of routines
 * (phases), each a list of days, each a list of exercise slots. Slots carry a
 * base set/rep scheme; the seed runner expands each into per-week `week_configs`
 * using a `WeekStep[]` progression (RIR ramp).
 */

type SlotSeed = {
  exerciseId: string;
  sets: number;
  reps: number;
  repsMax?: number;
  restSeconds: number;
  notes?: string;
  badges?: string[];
};

type DaySeed = {
  /** Slug suffix, made unique per routine when seeded. */
  slug: string;
  name: string;
  focusMuscles: string[];
  exercises: SlotSeed[];
};

type RoutineSeed = {
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

/** Routine-relative week prescription; the last week is an intensification. */
export type WeekStep = {
  rirMin: number | null;
  rirMax: number | null;
  toFailure: boolean;
  intensityType: IntensityType;
};

/** Standard 4-week RIR ramp: 3-4 → 2-3 → 1-2 → failure/test. */
export const WEEK_PROGRESSION: WeekStep[] = [
  { rirMin: 3, rirMax: 4, toFailure: false, intensityType: 'rir' },
  { rirMin: 2, rirMax: 3, toFailure: false, intensityType: 'rir' },
  { rirMin: 1, rirMax: 2, toFailure: false, intensityType: 'rir' },
  { rirMin: 0, rirMax: 0, toFailure: true, intensityType: 'rir' },
];
