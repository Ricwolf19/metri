import { and, asc, eq, or, isNull } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercises, type Exercise, type ExerciseCategory } from '@/db/schema';

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

/** Map of every exercise keyed by id — handy when rendering logged sets. */
export const exerciseMap = (): Map<string, Exercise> => {
  const rows = db.select().from(exercises).all();
  return new Map(rows.map((e) => [e.id, e]));
};
