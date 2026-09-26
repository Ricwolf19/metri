import { and, eq, isNotNull } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  exerciseSettings,
  userPrograms,
  workoutDayExercises,
  type ExerciseSetting,
} from '@/db/schema';
import { randomId } from '@/lib/crypto';

import { propagateSlotMeta } from './session.repo';

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
  propagateSettingsToEnrolled(userId, exerciseId, patch);
};

/**
 * The defaults are "configure once, reuse everywhere" — so editing them also
 * refreshes the slots already live in the user's enrolled copies and any
 * in-progress session rendering them (D1).
 */
const propagateSettingsToEnrolled = (
  userId: string,
  exerciseId: string,
  patch: {
    restSeconds?: number | null;
    badges?: string[] | null;
    alternativeExerciseIds?: string[] | null;
  },
): void => {
  const rows = db
    .select({ slot: workoutDayExercises })
    .from(workoutDayExercises)
    .innerJoin(userPrograms, eq(userPrograms.id, workoutDayExercises.userProgramId))
    .where(
      and(
        eq(userPrograms.userId, userId),
        isNotNull(workoutDayExercises.userProgramId),
        eq(workoutDayExercises.exerciseId, exerciseId),
      ),
    )
    .all();

  const now = new Date();
  for (const { slot } of rows) {
    db.update(workoutDayExercises)
      .set({
        ...(patch.restSeconds !== undefined ? { defaultRestSeconds: patch.restSeconds } : {}),
        ...(patch.badges !== undefined ? { badges: patch.badges } : {}),
        ...(patch.alternativeExerciseIds !== undefined
          ? { alternativeExerciseIds: patch.alternativeExerciseIds }
          : {}),
        updatedAt: now,
      })
      .where(eq(workoutDayExercises.id, slot.id))
      .run();
    propagateSlotMeta(slot.id, {
      ...(patch.restSeconds !== undefined ? { restSeconds: patch.restSeconds } : {}),
      ...(patch.badges !== undefined ? { badges: patch.badges ?? [] } : {}),
    });
  }
};
