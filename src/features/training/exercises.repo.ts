import { and, asc, eq, inArray, or, isNull } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  exerciseNotes,
  exerciseSettings,
  exercises,
  workoutDayExercises,
  type Equipment,
  type Exercise,
  type ExerciseCategory,
} from '@/db/schema';
import { recordDeletion } from '@/features/sync/tombstones';
import { randomId } from '@/lib/crypto';

/** A single exercise by id. */
export const getExercise = (id: string): Exercise | null => {
  const [row] = db.select().from(exercises).where(eq(exercises.id, id)).all();
  return row ?? null;
};

/**
 * Live query of the exercise library: global seeds (`userId` null) plus the
 * user's own custom exercises, optionally filtered to one category, A→Z.
 */
export const exercisesQuery = (userId: string, category?: ExerciseCategory) => {
  const owned = or(isNull(exercises.userId), eq(exercises.userId, userId));
  return db
    .select()
    .from(exercises)
    .where(category ? and(owned, eq(exercises.category, category)) : owned)
    .orderBy(asc(exercises.name));
};

/** What the session needs to know about an exercise beyond its snapshot: how
 * it is loaded and whether each side is logged on its own. Live, so a custom
 * exercise edited mid-program is reflected on the card. */
export const exerciseFactsQuery = (ids: string[]) =>
  db
    .select({ id: exercises.id, equipment: exercises.equipment, unilateral: exercises.unilateral })
    .from(exercises)
    .where(inArray(exercises.id, ids.length ? ids : ['']));

/* ── Custom exercises (user-authored library entries) ────────────────────────── */

export type ExerciseInput = {
  name: string;
  category: ExerciseCategory;
  equipment?: Equipment | null;
  unilateral?: boolean;
  primaryMuscles?: string[] | null;
  instructions?: string | null;
};

export const createCustomExercise = (userId: string, input: ExerciseInput): Exercise => {
  const [row] = db
    .insert(exercises)
    .values({
      id: randomId(),
      name: input.name,
      category: input.category,
      equipment: input.equipment ?? null,
      unilateral: input.unilateral ?? false,
      primaryMuscles: input.primaryMuscles ?? null,
      instructions: input.instructions ?? null,
      isCustom: true,
      userId,
    })
    .returning()
    .all();
  return row;
};

/** True when an exercise is referenced by any routine slot (blocks deletion). */
const isExerciseInUse = (id: string): boolean => {
  const [row] = db
    .select({ id: workoutDayExercises.id })
    .from(workoutDayExercises)
    .where(eq(workoutDayExercises.exerciseId, id))
    .limit(1)
    .all();
  return !!row;
};

/**
 * Delete a user-owned exercise. Returns false (a no-op) when it isn't the user's
 * or it's still referenced by a routine, so the caller can warn.
 */
export const deleteCustomExercise = (id: string, userId: string): boolean => {
  const ex = getExercise(id);
  if (!ex || ex.userId !== userId || !ex.isCustom) return false;
  if (isExerciseInUse(id)) return false;
  db.delete(exercises)
    .where(and(eq(exercises.id, id), eq(exercises.userId, userId)))
    .run();
  recordDeletion('exercises', id);
  // Its per-user defaults go with it — an orphan row would sync forever.
  const setting = db
    .select({ id: exerciseSettings.id })
    .from(exerciseSettings)
    .where(and(eq(exerciseSettings.exerciseId, id), eq(exerciseSettings.userId, userId)))
    .all()[0];
  if (setting) {
    db.delete(exerciseSettings).where(eq(exerciseSettings.id, setting.id)).run();
    recordDeletion('exercise_settings', setting.id);
  }
  // So does the lifter's note. Local-only table: no tombstone to record.
  db.delete(exerciseNotes)
    .where(and(eq(exerciseNotes.exerciseId, id), eq(exerciseNotes.userId, userId)))
    .run();
  return true;
};
