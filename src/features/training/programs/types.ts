import type { SetGroup } from '@/db/schema';

/**
 * Shared shape for a seeded program template. A program is a list of routines
 * (phases), each a list of days, each a list of exercise slots. Every slot
 * carries its EXPLICIT four-week prescription — there is no global
 * progression expansion.
 */

/** One routine-relative week for a slot. `setGroups` (top set + back-off)
 * overrides the flat scheme when present; no RIR and no `toFailure` means the
 * seed data must say one or the other explicitly. */
export type WeekSeed = {
  sets: number;
  reps: number;
  repsMax?: number;
  rirMin?: number;
  rirMax?: number;
  toFailure?: boolean;
  restSeconds: number;
  setGroups?: SetGroup[];
};

export type SlotSeed = {
  exerciseId: string;
  /** Exactly 4 entries, week 1 → 4. */
  weeks: WeekSeed[];
  /** Default rest shown on the slot (per-week rests still win in-session). */
  restSeconds: number;
  /** Interchangeable options ("deadlift or sumo") — catalog ids. */
  alternativeExerciseIds?: string[];
  notes?: string;
  /** ≤5 chips, ≤24 chars (authoring limits) — pauses, grips, variants. */
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
  routines: RoutineSeed[];
};
