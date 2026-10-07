import { and, eq, inArray, isNotNull } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  exerciseSettings,
  userPrograms,
  workoutDayExercises,
  type ExerciseSetting,
  type LoadDetail,
  type WorkoutDayExercise,
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

type SettingPatch = {
  restSeconds?: number | null;
  badges?: string[] | null;
  alternativeExerciseIds?: string[] | null;
  /** Written only by the session's weight sheet; it is not a slot field and never propagates. */
  load?: LoadDetail | null;
};

/** Live: the settings of the exercises on a session's cards (deps: the user and the slot→exercise key). */
export const exerciseSettingsQuery = (userId: string, exerciseIds: string[]) =>
  db
    .select()
    .from(exerciseSettings)
    .where(
      and(
        eq(exerciseSettings.userId, userId),
        inArray(exerciseSettings.exerciseId, exerciseIds.length ? exerciseIds : ['']),
      ),
    );

/** Plain rest for a slot when the owner configured none. */
const FALLBACK_REST_SECONDS = 120;

/** What `addSlot` writes onto a new slot from the owner's defaults (or none). */
export const slotSeed = (
  preset: Pick<ExerciseSetting, 'restSeconds' | 'badges' | 'alternativeExerciseIds'> | null,
): Pick<WorkoutDayExercise, 'defaultRestSeconds' | 'badges' | 'alternativeExerciseIds'> => ({
  defaultRestSeconds: preset?.restSeconds ?? FALLBACK_REST_SECONDS,
  badges: preset?.badges?.length ? preset.badges : null,
  alternativeExerciseIds: preset?.alternativeExerciseIds?.length
    ? preset.alternativeExerciseIds
    : null,
});

export const upsertExerciseSetting = (
  userId: string,
  exerciseId: string,
  patch: SettingPatch,
): void => {
  // Read before writing: propagation needs the default the slots were seeded with.
  const previous = getExerciseSetting(userId, exerciseId);
  db.insert(exerciseSettings)
    .values({ id: randomId(), userId, exerciseId, ...patch })
    .onConflictDoUpdate({
      target: [exerciseSettings.userId, exerciseSettings.exerciseId],
      set: { ...patch, updatedAt: new Date() },
    })
    .run();
  propagateSettingsToEnrolled(userId, exerciseId, previous, getExerciseSetting(userId, exerciseId));
};

/** Slot JSON arrays treat NULL and [] alike. */
const sameValue = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null) || (isEmptyList(a) && isEmptyList(b));

const isEmptyList = (v: unknown): boolean => v == null || (Array.isArray(v) && v.length === 0);

/**
 * The defaults are "configure once, reuse everywhere" — so editing them also
 * refreshes the slots of the user's ACTIVE enrollments and any in-progress
 * session rendering them (D1). A field moves only while the slot still holds
 * the PREVIOUS default: a slot the lifter customised, or a finished/paused
 * program, is history and keeps its values. Untouched slots are not stamped,
 * so a settings edit doesn't turn into a sync burst.
 */
const propagateSettingsToEnrolled = (
  userId: string,
  exerciseId: string,
  previous: ExerciseSetting | null,
  current: ExerciseSetting | null,
): void => {
  const before = slotSeed(previous);
  const after = slotSeed(current);
  const fields = (['defaultRestSeconds', 'badges', 'alternativeExerciseIds'] as const).filter(
    (f) => !sameValue(before[f], after[f]),
  );
  if (!fields.length) return;

  const rows = db
    .select({ slot: workoutDayExercises })
    .from(workoutDayExercises)
    .innerJoin(userPrograms, eq(userPrograms.id, workoutDayExercises.userProgramId))
    .where(
      and(
        eq(userPrograms.userId, userId),
        eq(userPrograms.status, 'active'),
        isNotNull(workoutDayExercises.userProgramId),
        eq(workoutDayExercises.exerciseId, exerciseId),
      ),
    )
    .all();

  const now = new Date();
  for (const { slot } of rows) {
    const changed = fields.filter((f) => sameValue(slot[f], before[f]));
    if (!changed.length) continue;
    db.update(workoutDayExercises)
      .set({ ...Object.fromEntries(changed.map((f) => [f, after[f]])), updatedAt: now })
      .where(eq(workoutDayExercises.id, slot.id))
      .run();
    propagateSlotMeta(
      slot.id,
      {
        ...(changed.includes('defaultRestSeconds') ? { rest: true } : {}),
        ...(changed.includes('badges') ? { badges: after.badges ?? [] } : {}),
      },
      userId,
    );
  }
};
