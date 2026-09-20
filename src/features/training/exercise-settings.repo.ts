import { and, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { exerciseSettings, type ExerciseSetting } from '@/db/schema';
import { randomId } from '@/lib/crypto';

/** @see src/db/schema.ts `exerciseSettings` — per-user defaults for an exercise. */
export const getExerciseSetting = (userId: string, exerciseId: string): ExerciseSetting | null =>
  db
    .select()
    .from(exerciseSettings)
    .where(and(eq(exerciseSettings.userId, userId), eq(exerciseSettings.exerciseId, exerciseId)))
    .all()[0] ?? null;

export const upsertExerciseSetting = (
  userId: string,
  exerciseId: string,
  patch: {
    restSeconds?: number | null;
    badges?: string[] | null;
    alternativeExerciseIds?: string[] | null;
  },
): void => {
  db.insert(exerciseSettings)
    .values({ id: randomId(), userId, exerciseId, ...patch })
    .onConflictDoUpdate({
      target: [exerciseSettings.userId, exerciseSettings.exerciseId],
      set: { ...patch, updatedAt: new Date() },
    })
    .run();
};
