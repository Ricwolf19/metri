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

import { catalogRestSeconds, legacyRestSeconds, propagateSlotMeta } from './session.repo';
import { DEFAULT_REST } from './slot-draft';

/** @see src/db/schema.ts `exerciseSettings` — per-user defaults for an exercise. */
export const getExerciseSetting = (userId: string, exerciseId: string): ExerciseSetting | null =>
  db
    .select()
    .from(exerciseSettings)
    .where(and(eq(exerciseSettings.userId, userId), eq(exerciseSettings.exerciseId, exerciseId)))
    .all()[0] ?? null;

export type SettingPatch = {
  restSeconds?: number | null;
  badges?: string[] | null;
  alternativeExerciseIds?: string[] | null;
  /** Written by the session's weight sheet and by the machine plates/stack
   * chooser (`machineLoadKind`); it is not a slot field and never propagates. */
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

/**
 * What `addSlot` writes onto a new slot from the owner's defaults (or none).
 * With no rest configured the slot rests at `fallbackRest` — the exercise's
 * own (`catalogRestSeconds`), so a new slot, a swap and a mid-session add all
 * agree, and settings propagation compares against the same baseline (and,
 * with nothing saved, the rule older builds seeded with: `legacyRestSeconds`).
 */
export const slotSeed = (
  preset: Pick<ExerciseSetting, 'restSeconds' | 'badges' | 'alternativeExerciseIds'> | null,
  fallbackRest: number = DEFAULT_REST,
): Pick<WorkoutDayExercise, 'defaultRestSeconds' | 'badges' | 'alternativeExerciseIds'> => ({
  defaultRestSeconds: preset?.restSeconds ?? fallbackRest,
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
  // Nothing to change (the weight sheet applied the load already saved, a wheel
  // settled where it was): no write, so no fresh `updatedAt` for sync to push.
  if (
    previous &&
    (Object.keys(patch) as (keyof SettingPatch)[]).every((key) =>
      sameValue(patch[key], previous[key]),
    )
  ) {
    return;
  }
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

const SLOT_FIELDS = ['defaultRestSeconds', 'badges', 'alternativeExerciseIds'] as const;
type SlotField = (typeof SLOT_FIELDS)[number];

/**
 * The defaults are "configure once, reuse everywhere" — so editing them also
 * refreshes the slots of the user's ACTIVE enrollments and any in-progress
 * session rendering them (D1). A field moves only while the slot is UNTOUCHED
 * — still holding the PREVIOUS default (`untouched` below is the one test): a
 * slot the lifter customised, or a finished/paused program, is history and
 * keeps its values. Untouched slots are not stamped, so a settings edit
 * doesn't turn into a sync burst.
 */
const propagateSettingsToEnrolled = (
  userId: string,
  exerciseId: string,
  previous: ExerciseSetting | null,
  current: ExerciseSetting | null,
): void => {
  const fallbackRest = catalogRestSeconds(exerciseId);
  const before = slotSeed(previous, fallbackRest);
  const after = slotSeed(current, fallbackRest);
  // The rest is in play when the SAVED rest changed: a first save of exactly the
  // default still reaches slots on the legacy rule, and a badge or load edit
  // never re-rests anything.
  const fields = SLOT_FIELDS.filter((f) =>
    f === 'defaultRestSeconds'
      ? !sameValue(previous?.restSeconds, current?.restSeconds)
      : !sameValue(before[f], after[f]),
  );
  if (!fields.length) return;

  // With no rest of the lifter's own saved yet, a slot holding the two-band rule
  // older builds seeded with (`legacyRestSeconds`: a curl at 120 where the table
  // says 75; every preset slot's 120/180, which the sheets prescribe by the same
  // rule) is as untouched as one on today's default. Once they saved one, that
  // saved rest is the only baseline.
  const legacyRest = previous?.restSeconds == null ? legacyRestSeconds(exerciseId) : null;
  const untouched = (slot: WorkoutDayExercise, f: SlotField): boolean =>
    sameValue(slot[f], before[f]) ||
    (f === 'defaultRestSeconds' && legacyRest != null && slot.defaultRestSeconds === legacyRest);

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
    const changed = fields.filter((f) => untouched(slot, f) && !sameValue(slot[f], after[f]));
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
