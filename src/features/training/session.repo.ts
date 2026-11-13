import { and, asc, desc, eq, inArray, isNotNull, lte, ne, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import type { Locale } from '@/i18n';

import { exerciseDisplayName } from './labels';
import {
  exerciseSettings,
  exercises,
  setLogs,
  weekConfigs,
  workoutDayExercises,
  workoutDays,
  workoutLogs,
  type Exercise,
  type LoadDetail,
  type PlannedSlot,
  type SetGroup,
  type SetLog,
  type SlotSwap,
  type SwapReason,
  type WeekConfig,
  type WorkoutDayExercise,
  type WorkoutLog,
} from '@/db/schema';
import { randomId } from '@/lib/crypto';

import { recordDeletion } from '@/features/sync/tombstones';

import { localDateKey, markTrainingDay, releaseTrainingDay } from './adherence.repo';
import { advanceUserProgram, rewindUserProgram } from './enroll';
import { defaultRestFor } from './exercise-rest';
import { setVolumeKg } from './load';
import { plannedSets } from './rest-summary';
import { sessionBadges } from './session-badges';
import { estimate1Rm, roundToPlate, weightForReps } from './progression';
import { DEFAULT_REST } from './slot-draft';

/* ── Active session ──────────────────────────────────────────────────────── */

/** Live query of the active session — the UI reads it instead of a global store. */
export const activeWorkoutQuery = (userId: string) =>
  db
    .select()
    .from(workoutLogs)
    .where(and(eq(workoutLogs.userId, userId), eq(workoutLogs.status, 'in_progress')))
    .orderBy(desc(workoutLogs.startedAt));

export const getWorkout = (id: string): WorkoutLog | null => {
  const [row] = db.select().from(workoutLogs).where(eq(workoutLogs.id, id)).all();
  return row ?? null;
};

/** Live view of one session row: snapshot edits (swap, reorder) must re-render
 * the screen that is logging against it. */
export const workoutQuery = (id: string) =>
  db.select().from(workoutLogs).where(eq(workoutLogs.id, id)).limit(1);

/** The week's prescription as concrete set groups: explicit `setGroups` win,
 * else the flat scheme, else a sane default for slots with no config. */
const expandPrescription = (config: WeekConfig | null): SetGroup[] => {
  if (config?.setGroups?.length) return config.setGroups;
  if (config) {
    return [
      {
        sets: config.sets,
        reps: config.reps,
        ...(config.repsMax != null ? { repsMax: config.repsMax } : {}),
        ...(config.rirMin != null ? { rirMin: config.rirMin } : {}),
        ...(config.rirMax != null ? { rirMax: config.rirMax } : {}),
        ...(config.toFailure ? { toFailure: true } : {}),
      },
    ];
  }
  return [{ sets: 3, reps: 8 }];
};

/** The rest a session runs for a slot: the week's override wins over the slot
 * default. `propagateSlotMeta` re-resolves with this same rule. */
const resolveRest = (
  slot: Pick<WorkoutDayExercise, 'defaultRestSeconds'>,
  config: Pick<WeekConfig, 'restSeconds'> | null,
): number | null => config?.restSeconds ?? slot.defaultRestSeconds ?? null;

/**
 * Begin a session for a workout day at a routine-relative week. The week's
 * prescription is materialized into `plannedSnapshot` so the session renders
 * from one query and stays immune to program edits mid-week.
 */
export const startWorkout = (
  userId: string,
  userProgramId: string,
  workoutDayId: string,
  weekNumber: number,
  /** Snapshot names freeze in this language (caller's UI locale). */
  locale: Locale = 'en',
): WorkoutLog => {
  const plannedSnapshot: PlannedSlot[] = getSessionSlots(workoutDayId, weekNumber).map(
    ({ slot, exercise, config }) => {
      // A temporary swap opens this session on the variant and uses one of its
      // sessions up; the slot's own exercise stays as the original to swap back.
      const swap = slot.swap && slot.swap.sessionsLeft > 0 ? consumeSlotSwap(slot) : null;
      const shown = swap ? (getExerciseRow(swap.exerciseId) ?? exercise) : exercise;
      return {
        slotId: slot.id,
        exerciseId: shown.id,
        // Frozen at session start in the user's locale (snapshots never re-resolve).
        name: exerciseDisplayName(shown, locale),
        setGroups: expandPrescription(config),
        // A countdown swap rests as the exercise it opens on, not as the one it replaced.
        restSeconds:
          shown.id !== exercise.id
            ? exerciseRestSeconds(userId, shown.id)
            : resolveRest(slot, config),
        badges: slot.badges ?? [],
        alternativeExerciseIds: slot.alternativeExerciseIds ?? [],
        notes: slot.notes ?? null,
        ...(swap && shown.id !== exercise.id
          ? { originalExerciseId: exercise.id, swapReason: swap.reason }
          : {}),
      };
    },
  );

  const [row] = db
    .insert(workoutLogs)
    .values({
      id: randomId(),
      userId,
      userProgramId,
      workoutDayId,
      weekNumber,
      status: 'in_progress',
      plannedSnapshot,
    })
    .returning()
    .all();
  return row;
};

/** Whether the lifter warmed up before the session; null re-asks. Asked once from the card at the top. */
export const setWarmupDone = (id: string, done: boolean | null): void => {
  db.update(workoutLogs)
    .set({ warmupDone: done, updatedAt: new Date() })
    .where(eq(workoutLogs.id, id))
    .run();
};

/** Finish a session: stamp it completed with an elapsed duration. */
export const finishWorkout = (id: string, rating?: number, notes?: string): void => {
  const log = getWorkout(id);
  if (!log) return;
  const durationSeconds = Math.max(0, Math.round((Date.now() - log.startedAt.getTime()) / 1000));
  db.update(workoutLogs)
    .set({
      status: 'completed',
      completedAt: new Date(),
      durationSeconds,
      rating: rating ?? null,
      notes: notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(workoutLogs.id, id))
    .run();

  // Close the adherence loop: finishing a session marks today "trained".
  markTrainingDay(log.userId, {
    date: localDateKey(),
    status: 'trained',
    workoutLogId: log.id,
    workoutDayId: log.workoutDayId,
  });

  // Move the program forward when this finish completed the week.
  advanceUserProgram(log.userProgramId);
};

/**
 * Live query of the splits RESOLVED in a program week — completed, or skipped
 * on purpose — with which it was (the Train tab greys a done split and marks a
 * skipped one in the missed colour). Open and abandoned sessions resolve nothing.
 */
export const completedDaysQuery = (userProgramId: string, weekNumber: number) =>
  db
    .select({ dayId: workoutLogs.workoutDayId, status: workoutLogs.status })
    .from(workoutLogs)
    .where(
      and(
        eq(workoutLogs.userProgramId, userProgramId),
        eq(workoutLogs.weekNumber, weekNumber),
        inArray(workoutLogs.status, ['completed', 'skipped']),
      ),
    );

/** One exercise of a split as a session would open it that week. */
export type SplitPreviewRow = {
  exerciseId: string;
  name: string;
  /** The week's set groups, expanded the way `startWorkout` expands them. */
  groups: SetGroup[];
  /** The rest the session would run: the week's override, else the slot's. */
  restSeconds: number | null;
  /** The slot's cues as stored, retired ones dropped (render with `badgeLabel`). */
  badges: string[];
};

/**
 * What a split holds in a given week, to read — the Train tab's preview of a
 * split not up yet, and a program's quick view (any phase, any week). The same
 * expansion and rest rule as `startWorkout`, so what is read is what opens.
 */
export const splitPreview = (
  workoutDayId: string,
  weekNumber: number,
  locale: Locale,
): SplitPreviewRow[] =>
  getSessionSlots(workoutDayId, weekNumber).map(({ slot, exercise, config }) => ({
    exerciseId: exercise.id,
    name: exerciseDisplayName(exercise, locale),
    groups: expandPrescription(config),
    restSeconds: resolveRest(slot, config),
    badges: sessionBadges(slot.badges),
  }));

const deleteSetsOf = (workoutLogId: string): void => {
  const setIds = db
    .select({ id: setLogs.id })
    .from(setLogs)
    .where(eq(setLogs.workoutLogId, workoutLogId))
    .all()
    .map((r) => r.id);
  db.delete(setLogs).where(eq(setLogs.workoutLogId, workoutLogId)).run();
  recordDeletion('set_logs', setIds);
};

/** Discard a session and its sets (used to cancel a started-by-mistake workout). */
export const abandonWorkout = (id: string): void => {
  deleteSetsOf(id);
  db.update(workoutLogs)
    .set({ status: 'abandoned', updatedAt: new Date() })
    .where(eq(workoutLogs.id, id))
    .run();
};

/**
 * Hard-delete a session and everything it recorded, then undo what finishing
 * it did: the day it marked trained is released and the program rewinds if
 * that week is no longer complete. Returns whether the program moved back, so
 * the caller can re-sync reminders for a schedule that may have changed.
 */
export const deleteWorkout = (id: string): boolean => {
  const log = getWorkout(id);
  if (!log) return false;
  deleteSetsOf(id);
  db.delete(workoutLogs).where(eq(workoutLogs.id, id)).run();
  recordDeletion('workout_logs', id);
  releaseTrainingDay(log.userId, id);

  // A skip resolved the week like a finished session did, so its deletion rewinds too.
  if (log.status !== 'completed' && log.status !== 'skipped') return false;
  const [day] = db
    .select({ routineId: workoutDays.routineId })
    .from(workoutDays)
    .where(eq(workoutDays.id, log.workoutDayId))
    .all();
  return day ? rewindUserProgram(log.userProgramId, day.routineId, log.weekNumber) : false;
};

/** Live query of a program's finished sessions, newest first, with their working-set totals.
 * `skipped` logs stay out: they are a cursor record, not a session, and the day sheet is their undo surface. */
export const programSessionsQuery = (userProgramId: string) =>
  db
    .select({
      id: workoutLogs.id,
      workoutDayId: workoutLogs.workoutDayId,
      weekNumber: workoutLogs.weekNumber,
      completedAt: workoutLogs.completedAt,
      durationSeconds: workoutLogs.durationSeconds,
      routineId: workoutDays.routineId,
      dayName: workoutDays.name,
      dayOrder: workoutDays.orderIndex,
      setCount: sql<number>`count(${setLogs.id})`,
      // The typed number IS the total for a bar or a stack; only two dumbbells
      // double it (`load.ts` `setVolumeKg`, in SQL for the live aggregate).
      volumeKg: sql<number>`coalesce(sum(${setLogs.weightKg} * ${setLogs.reps} * coalesce(json_extract(${setLogs.load}, '$.hands'), 1)), 0)`,
    })
    .from(workoutLogs)
    .leftJoin(workoutDays, eq(workoutDays.id, workoutLogs.workoutDayId))
    .leftJoin(setLogs, and(eq(setLogs.workoutLogId, workoutLogs.id), eq(setLogs.isWarmup, false)))
    .where(and(eq(workoutLogs.userProgramId, userProgramId), eq(workoutLogs.status, 'completed')))
    .groupBy(workoutLogs.id)
    .orderBy(desc(workoutLogs.completedAt));

export type ProgramSession = Awaited<
  ReturnType<ReturnType<typeof programSessionsQuery>['all']>
>[number];

/* ── Session exercises (slot + exercise + this week's prescription) ────────── */

type SessionSlot = {
  slot: WorkoutDayExercise;
  exercise: Exercise;
  config: WeekConfig | null;
};

const getSessionSlots = (workoutDayId: string, weekNumber: number): SessionSlot[] =>
  db
    .select({ slot: workoutDayExercises, exercise: exercises, config: weekConfigs })
    .from(workoutDayExercises)
    .innerJoin(exercises, eq(exercises.id, workoutDayExercises.exerciseId))
    .leftJoin(
      weekConfigs,
      and(
        eq(weekConfigs.workoutDayExerciseId, workoutDayExercises.id),
        eq(weekConfigs.weekNumber, weekNumber),
      ),
    )
    .where(eq(workoutDayExercises.workoutDayId, workoutDayId))
    .orderBy(asc(workoutDayExercises.orderIndex))
    .all();

/* ── Set logging ───────────────────────────────────────────────────────────── */

/** Live query of the sets logged in a session, oldest-first. */
export const setLogsQuery = (workoutLogId: string) =>
  db
    .select()
    .from(setLogs)
    .where(eq(setLogs.workoutLogId, workoutLogId))
    .orderBy(asc(setLogs.createdAt));

export type LogSetInput = {
  workoutLogId: string;
  exerciseId: string;
  weightKg: number;
  reps: number;
  rpe?: number | null;
  rir?: number | null;
  isWarmup?: boolean;
  isFailure?: boolean;
  restBeforeSeconds?: number | null;
  load?: LoadDetail | null;
};

/** Append a set; the set number is derived from the sets already logged for it. */
export const logSet = (input: LogSetInput): SetLog => {
  const prior = db
    .select()
    .from(setLogs)
    .where(
      and(eq(setLogs.workoutLogId, input.workoutLogId), eq(setLogs.exerciseId, input.exerciseId)),
    )
    .all();
  const [row] = db
    .insert(setLogs)
    .values({
      id: randomId(),
      workoutLogId: input.workoutLogId,
      exerciseId: input.exerciseId,
      setNumber: prior.length + 1,
      weightKg: input.weightKg,
      reps: input.reps,
      rpe: input.rpe ?? null,
      rir: input.rir ?? null,
      isWarmup: input.isWarmup ?? false,
      isFailure: input.isFailure ?? false,
      restBeforeSeconds: input.restBeforeSeconds ?? null,
      load: input.load ?? null,
    })
    .returning()
    .all();
  return row;
};

export type SetPatch = Pick<SetLog, 'weightKg' | 'reps' | 'load' | 'rir' | 'isFailure'>;

/** Rewrite a logged set in place — a correction, not a new set: no renumbering, no rest. */
export const updateSet = (id: string, patch: SetPatch): void => {
  db.update(setLogs)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(setLogs.id, id))
    .run();
};

/** Deleting a middle set closes the gap: `set_number` stays 1..n per (log, exercise). */
export const deleteSet = (id: string): void => {
  const [row] = db.select().from(setLogs).where(eq(setLogs.id, id)).all();
  db.delete(setLogs).where(eq(setLogs.id, id)).run();
  recordDeletion('set_logs', id);
  if (row) renumberSets(row.workoutLogId, row.exerciseId);
};

const renumberSets = (workoutLogId: string, exerciseId: string): void => {
  const rows = db
    .select({ id: setLogs.id, setNumber: setLogs.setNumber })
    .from(setLogs)
    .where(and(eq(setLogs.workoutLogId, workoutLogId), eq(setLogs.exerciseId, exerciseId)))
    .orderBy(asc(setLogs.createdAt), asc(setLogs.setNumber))
    .all();
  const now = new Date();
  rows.forEach((r, i) => {
    if (r.setNumber === i + 1) return;
    db.update(setLogs)
      .set({ setNumber: i + 1, updatedAt: now })
      .where(eq(setLogs.id, r.id))
      .run();
  });
};

export type PreviousSession = { logId: string; finishedAt: Date; sets: SetLog[] };

/**
 * The last time this exercise was trained: the newest COMPLETED session with a
 * working set of it — any split, any week — and those sets in order. Set N of
 * the live card is seeded from set N here and the card shows the whole thing
 * as "Last training". The open session is excluded by status, so its own sets
 * never feed back; "last week" (same split at week − 1) was empty in week 1 of
 * every phase and blind to the same exercise on another split.
 */
export const previousSessionSets = (exerciseId: string): PreviousSession | null => {
  const [prior] = db
    .select({
      id: workoutLogs.id,
      completedAt: workoutLogs.completedAt,
      startedAt: workoutLogs.startedAt,
    })
    .from(workoutLogs)
    .innerJoin(setLogs, eq(setLogs.workoutLogId, workoutLogs.id))
    .where(
      and(
        eq(setLogs.exerciseId, exerciseId),
        eq(setLogs.isWarmup, false),
        eq(workoutLogs.status, 'completed'),
      ),
    )
    .orderBy(desc(workoutLogs.completedAt), desc(workoutLogs.startedAt))
    .limit(1)
    .all();
  if (!prior) return null;
  const sets = db
    .select()
    .from(setLogs)
    .where(
      and(
        eq(setLogs.workoutLogId, prior.id),
        eq(setLogs.exerciseId, exerciseId),
        eq(setLogs.isWarmup, false),
      ),
    )
    .orderBy(asc(setLogs.setNumber))
    .all();
  return { logId: prior.id, finishedAt: prior.completedAt ?? prior.startedAt, sets };
};

const getExerciseRow = (id: string): Exercise | null =>
  db.select().from(exercises).where(eq(exercises.id, id)).all()[0] ?? null;

/** Whether a split already plans this exercise. */
const dayPlans = (workoutDayId: string, exerciseId: string): boolean =>
  db
    .select({ id: workoutDayExercises.id })
    .from(workoutDayExercises)
    .where(
      and(
        eq(workoutDayExercises.workoutDayId, workoutDayId),
        eq(workoutDayExercises.exerciseId, exerciseId),
      ),
    )
    .limit(1)
    .all().length > 0;

/**
 * The same planned exercise on the OTHER splits of the slot's phase: a full
 * body A/B/C repeats its exercises, and a swap "from now on" made on A must
 * not come back on B. Matched by exercise and by occurrence within the day
 * (the second lat pulldown of B pairs with the second of B's twin, never the
 * first — they carry different grips).
 */
const siblingSlots = (slot: WorkoutDayExercise): WorkoutDayExercise[] => {
  const [day] = db
    .select({ routineId: workoutDays.routineId })
    .from(workoutDays)
    .where(eq(workoutDays.id, slot.workoutDayId))
    .all();
  if (!day) return [];
  const rows = db
    .select({ slot: workoutDayExercises })
    .from(workoutDayExercises)
    .innerJoin(workoutDays, eq(workoutDays.id, workoutDayExercises.workoutDayId))
    .where(
      and(
        eq(workoutDays.routineId, day.routineId),
        eq(workoutDayExercises.exerciseId, slot.exerciseId),
      ),
    )
    .orderBy(asc(workoutDayExercises.orderIndex))
    .all()
    .map((r) => r.slot);
  const occurrence = (s: WorkoutDayExercise) =>
    rows.filter((r) => r.workoutDayId === s.workoutDayId).indexOf(s);
  const mine = rows.findIndex((r) => r.id === slot.id);
  if (mine < 0) return [];
  const nth = occurrence(rows[mine]);
  return rows.filter((r) => r.workoutDayId !== slot.workoutDayId && occurrence(r) === nth);
};

/**
 * Spend one session of a temporary swap; the column clears on the last one.
 * The count is shared with the twin slots it was written to (`applySwap`):
 * "the next two sessions" means two sessions with that exercise, whichever
 * split they fall on.
 */
const consumeSlotSwap = (slot: WorkoutDayExercise): SlotSwap | null => {
  const swap = slot.swap;
  if (!swap) return null;
  const left = swap.sessionsLeft - 1;
  const twins = siblingSlots(slot).filter(
    (s) => s.swap?.exerciseId === swap.exerciseId && s.swap.reason === swap.reason,
  );
  for (const id of [slot.id, ...twins.map((s) => s.id)]) {
    db.update(workoutDayExercises)
      .set({ swap: left > 0 ? { ...swap, sessionsLeft: left } : null, updatedAt: new Date() })
      .where(eq(workoutDayExercises.id, id))
      .run();
  }
  return swap;
};

/** Rewrite one slot of a session's snapshot; no-op when the log or slot is unknown. */
const patchSnapshotSlot = (
  logId: string,
  slotId: string,
  patch: (slot: PlannedSlot) => PlannedSlot,
): void => {
  const log = getWorkout(logId);
  if (!log?.plannedSnapshot?.some((p) => p.slotId === slotId)) return;
  db.update(workoutLogs)
    .set({
      plannedSnapshot: log.plannedSnapshot.map((p) => (p.slotId === slotId ? patch(p) : p)),
      updatedAt: new Date(),
    })
    .where(eq(workoutLogs.id, logId))
    .run();
};

/**
 * The snapshot entry for one slot of the plan at a week — the same
 * materialisation `startWorkout` does, for a slot written after the session
 * began (an exercise added mid-session and kept in the split).
 */
export const plannedSlotFor = (
  slotId: string,
  weekNumber: number,
  locale: Locale,
): PlannedSlot | null => {
  const [row] = db
    .select({ slot: workoutDayExercises, exercise: exercises })
    .from(workoutDayExercises)
    .innerJoin(exercises, eq(exercises.id, workoutDayExercises.exerciseId))
    .where(eq(workoutDayExercises.id, slotId))
    .all();
  if (!row) return null;
  const config = weekConfigFor(slotId, weekNumber);
  return {
    slotId,
    exerciseId: row.exercise.id,
    name: exerciseDisplayName(row.exercise, locale),
    setGroups: expandPrescription(config),
    restSeconds: resolveRest(row.slot, config),
    badges: row.slot.badges ?? [],
    alternativeExerciseIds: row.slot.alternativeExerciseIds ?? [],
    notes: row.slot.notes ?? null,
  };
};

/** Append a slot to a live session's snapshot (it lands last in the strip's active part). */
export const appendSnapshotSlot = (logId: string, slot: PlannedSlot): void => {
  const log = getWorkout(logId);
  if (!log) return;
  db.update(workoutLogs)
    .set({ plannedSnapshot: [...(log.plannedSnapshot ?? []), slot], updatedAt: new Date() })
    .where(eq(workoutLogs.id, logId))
    .run();
};

/**
 * How long an exercise rests away from a slot that plans it: the lifter's own
 * default for it (`exercise_settings`), else what it trains calls for. Reads
 * the table here rather than through `getExerciseSetting`, whose module
 * imports this one.
 */
/** What an exercise rests at when nobody set a rest for it: what it trains calls for. */
export const catalogRestSeconds = (exerciseId: string): number => {
  const exercise = getExerciseRow(exerciseId);
  return exercise ? defaultRestFor(exercise) : DEFAULT_REST;
};

export const exerciseRestSeconds = (userId: string, exerciseId: string): number => {
  const [setting] = db
    .select({ restSeconds: exerciseSettings.restSeconds })
    .from(exerciseSettings)
    .where(and(eq(exerciseSettings.userId, userId), eq(exerciseSettings.exerciseId, exerciseId)))
    .all();
  if (setting?.restSeconds != null) return setting.restSeconds;
  const exercise = getExerciseRow(exerciseId);
  // An id the catalog no longer knows rests at the plain default.
  return exercise ? defaultRestFor(exercise) : DEFAULT_REST;
};

/** The rest of an exercise landing on a slot: the plan's own, swapping back to it; else its own. */
const restOnSlot = (log: WorkoutLog, slotId: string, exerciseId: string): number => {
  const [slot] = db
    .select()
    .from(workoutDayExercises)
    .where(eq(workoutDayExercises.id, slotId))
    .all();
  const planned =
    slot?.exerciseId === exerciseId
      ? resolveRest(slot, weekConfigFor(slotId, log.weekNumber))
      : null;
  return planned ?? exerciseRestSeconds(log.userId, exerciseId);
};

/** Swap a snapshot slot to an alternative exercise for THIS session only; its timer follows. */
export const swapSnapshotExercise = (
  logId: string,
  slotId: string,
  exerciseId: string,
  exerciseName: string,
  reason?: SwapReason,
): void => {
  const log = getWorkout(logId);
  if (!log) return;
  const restSeconds = restOnSlot(log, slotId, exerciseId);
  patchSnapshotSlot(logId, slotId, (p) => ({
    ...p,
    originalExerciseId: p.originalExerciseId ?? p.exerciseId,
    exerciseId,
    name: exerciseName,
    restSeconds,
    ...(reason ? { swapReason: reason } : {}),
  }));
};

export type SwapScope =
  { kind: 'session' } | { kind: 'sessions'; count: number } | { kind: 'cycle' };

/**
 * A swap with a scope. The session's snapshot always changes; beyond it, the
 * enrolled slot — and the same exercise on the phase's other splits
 * (`siblingSlots`) — either counts down the next sessions (`swap` column) or
 * is rewritten for the rest of the cycle, keeping the planned exercise among
 * its alternatives so it can be swapped back. Template slots are never touched.
 */
export const applySwap = (input: {
  logId: string;
  slotId: string;
  exerciseId: string;
  exerciseName: string;
  reason: SwapReason;
  scope: SwapScope;
}): void => {
  const { logId, slotId, exerciseId, exerciseName, reason, scope } = input;
  swapSnapshotExercise(logId, slotId, exerciseId, exerciseName, reason);
  const log = getWorkout(logId);
  const slot = db
    .select()
    .from(workoutDayExercises)
    .where(eq(workoutDayExercises.id, slotId))
    .all()[0];
  // Enrolled, never a template: the slot sits on the day this session was
  // started from, and a session only ever starts from an enrolled copy. Not
  // `slot.userProgramId` — copies enrolled before that column existed carry
  // NULL there, and the swap silently went nowhere; it is backfilled here.
  if (!log || !slot || slot.workoutDayId !== log.workoutDayId) return;
  const userProgramId = slot.userProgramId ?? log.userProgramId;
  // Beyond today the swap follows the exercise onto the phase's other splits:
  // the same exercise on a twin day is the same decision. A twin that already
  // plans the new exercise keeps its slot, or the swap would repeat it there.
  const targets = [
    slot,
    ...siblingSlots(slot).filter((twin) => !dayPlans(twin.workoutDayId, exerciseId)),
  ];
  if (scope.kind === 'sessions' && scope.count > 1) {
    for (const target of targets) {
      db.update(workoutDayExercises)
        .set({
          swap: { exerciseId, sessionsLeft: scope.count - 1, reason },
          userProgramId: target.userProgramId ?? userProgramId,
          updatedAt: new Date(),
        })
        .where(eq(workoutDayExercises.id, target.id))
        .run();
    }
  } else if (scope.kind === 'cycle' && slot.exerciseId !== exerciseId) {
    const restSeconds = exerciseRestSeconds(log.userId, exerciseId);
    const now = new Date();
    for (const target of targets) {
      const alternatives = [...(target.alternativeExerciseIds ?? []), target.exerciseId].filter(
        (id, i, all) => id !== exerciseId && all.indexOf(id) === i,
      );
      db.update(workoutDayExercises)
        .set({
          exerciseId,
          alternativeExerciseIds: alternatives,
          swap: null,
          defaultRestSeconds: restSeconds,
          userProgramId: target.userProgramId ?? userProgramId,
          updatedAt: now,
        })
        .where(eq(workoutDayExercises.id, target.id))
        .run();
      // A week's rest override wins over the slot default, and it was written
      // for the exercise that just left. Only rows holding one are stamped:
      // `updatedAt` is what sync pushes.
      db.update(weekConfigs)
        .set({ restSeconds: null, updatedAt: now })
        .where(
          and(eq(weekConfigs.workoutDayExerciseId, target.id), isNotNull(weekConfigs.restSeconds)),
        )
        .run();
    }
  }
};

/** Skip (or restore) a whole exercise this session: its planned sets count as missed. */
export const skipSnapshotExercise = (logId: string, slotId: string, skipped: boolean): void =>
  patchSnapshotSlot(logId, slotId, ({ skipped: _was, ...p }) =>
    skipped ? { ...p, skipped: { at: Date.now() } } : p,
  );

/** Skip (or restore) one planned row of an exercise this session. */
export const skipSnapshotSet = (
  logId: string,
  slotId: string,
  index: number,
  skipped: boolean,
): void =>
  patchSnapshotSlot(logId, slotId, (p) => {
    const rest = (p.skippedSets ?? []).filter((i) => i !== index);
    const next = skipped ? [...rest, index].sort((a, b) => a - b) : rest;
    const { skippedSets: _old, ...base } = p;
    return next.length ? { ...base, skippedSets: next } : base;
  });

/**
 * Planned rows still open become skipped, so the session records "these sets
 * were missed", not a plan that had been shorter: every exercise when it
 * closes, or one exercise when the lifter moves on from it (`slotId`).
 */
export const markRemainingSkipped = (logId: string, slotId?: string): void => {
  const log = getWorkout(logId);
  if (!log?.plannedSnapshot) return;
  const working = db
    .select({ exerciseId: setLogs.exerciseId })
    .from(setLogs)
    .where(and(eq(setLogs.workoutLogId, logId), eq(setLogs.isWarmup, false)))
    .all();
  const doneFor = (exerciseId: string) => working.filter((s) => s.exerciseId === exerciseId).length;
  const next = log.plannedSnapshot.map((p) => {
    if (p.skipped || (slotId && p.slotId !== slotId)) return p;
    const total = plannedSets(p);
    const done = doneFor(p.exerciseId);
    const already = new Set(p.skippedSets ?? []);
    // Logged sets fill the open ordinals in order; whatever is left is missed.
    const open: number[] = [];
    let filled = 0;
    for (let i = 0; i < total; i++) {
      if (already.has(i)) continue;
      if (filled < done) filled += 1;
      else open.push(i);
    }
    if (!open.length) return p;
    return { ...p, skippedSets: [...already, ...open].sort((a, b) => a - b) };
  });
  db.update(workoutLogs)
    .set({ plannedSnapshot: next, updatedAt: new Date() })
    .where(eq(workoutLogs.id, logId))
    .run();
};

/**
 * Push slot meta edits (badges, note, rest) into every in-progress session
 * whose snapshot contains the slot — editing a routine keeps the live session
 * in sync instead of stranding it with stale cues.
 *
 * `rest: true` re-resolves the rest from the slot's CURRENT rows for each log's
 * week, with the same precedence `startWorkout` uses — pushing the slot default
 * straight in would clobber a per-week override (Foundations prescribes one).
 * Badges describe the planned exercise, so a slot swapped to a variant keeps
 * its own. Call after the slot/week rows are written.
 */
export const propagateSlotMeta = (
  slotId: string,
  meta: { badges?: string[]; notes?: string | null; rest?: boolean },
  userId?: string,
): void => {
  const logs = db
    .select()
    .from(workoutLogs)
    .where(
      and(
        eq(workoutLogs.status, 'in_progress'),
        userId ? eq(workoutLogs.userId, userId) : undefined,
      ),
    )
    .all();
  const [slot] = meta.rest
    ? db.select().from(workoutDayExercises).where(eq(workoutDayExercises.id, slotId)).all()
    : [];
  const now = new Date();
  for (const log of logs) {
    if (!log.plannedSnapshot?.some((p) => p.slotId === slotId)) continue;
    const rest = slot ? resolveRest(slot, weekConfigFor(slotId, log.weekNumber)) : undefined;
    const next = log.plannedSnapshot.map((p) =>
      p.slotId === slotId
        ? {
            ...p,
            ...(meta.badges !== undefined && !p.originalExerciseId ? { badges: meta.badges } : {}),
            ...(meta.notes !== undefined ? { notes: meta.notes } : {}),
            // A swapped slot rests as the exercise on it, not as the planned one.
            ...(rest !== undefined && !p.originalExerciseId ? { restSeconds: rest } : {}),
          }
        : p,
    );
    // Only a real change stamps the log: `updatedAt` is what sync pushes.
    if (JSON.stringify(next) === JSON.stringify(log.plannedSnapshot)) continue;
    db.update(workoutLogs)
      .set({ plannedSnapshot: next, updatedAt: now })
      .where(eq(workoutLogs.id, log.id))
      .run();
  }
};

const weekConfigFor = (slotId: string, weekNumber: number): WeekConfig | null =>
  db
    .select()
    .from(weekConfigs)
    .where(
      and(eq(weekConfigs.workoutDayExerciseId, slotId), eq(weekConfigs.weekNumber, weekNumber)),
    )
    .all()[0] ?? null;

/** Persist a mid-session exercise reorder ("machine was taken, did legs first") —
 * the reordered snapshot IS the record of how the session actually ran. */
export const reorderSnapshot = (logId: string, orderedSlotIds: string[]): void => {
  const log = getWorkout(logId);
  if (!log?.plannedSnapshot) return;
  // The order must be an exact permutation — anything else is a caller bug,
  // and silently dropping a slot would lose planned work mid-session.
  if (orderedSlotIds.length !== log.plannedSnapshot.length) return;
  const bySlot = new Map(log.plannedSnapshot.map((p) => [p.slotId, p]));
  const next = orderedSlotIds.flatMap((slotId) => bySlot.get(slotId) ?? []);
  if (next.length !== log.plannedSnapshot.length) return;
  db.update(workoutLogs)
    .set({ plannedSnapshot: next, updatedAt: new Date() })
    .where(eq(workoutLogs.id, logId))
    .run();
};

type SummaryExercise = {
  exerciseId: string;
  /** Display name in the caller's locale. */
  name: string;
  topKg: number;
  /** Reps of the top set (the heaviest; ties keep the more reps). */
  topReps: number;
  isPr: boolean;
};

export type SessionSummary = {
  volumeKg: number;
  setCount: number;
  durationSeconds: number;
  /** Display names of the exercises that set a record — the modal's one line. */
  prs: string[];
  /** Every exercise with its top set, in logging order — the share card's rows. */
  exercises: SummaryExercise[];
  /** Planned sets skipped or left unfilled: missed volume, shown when above zero. */
  missedSets: number;
};

/** Post-workout summary: volume, working sets, duration, and simple PRs (a
 * session top weight beating everything logged before it). */
export const sessionSummary = (logId: string, locale: Locale = 'en'): SessionSummary => {
  const log = getWorkout(logId);
  const rows = db
    .select()
    .from(setLogs)
    .where(and(eq(setLogs.workoutLogId, logId), eq(setLogs.isWarmup, false)))
    .orderBy(asc(setLogs.createdAt), asc(setLogs.setNumber))
    .all();
  const volumeKg = Math.round(rows.reduce((sum, r) => sum + setVolumeKg(r), 0));
  // A closed session keeps the length it was saved with (a past one is shared from the day sheet).
  const durationSeconds = log
    ? (log.durationSeconds ??
      Math.max(0, Math.round((Date.now() - log.startedAt.getTime()) / 1000)))
    : 0;

  const topByExercise = new Map<string, { weightKg: number; reps: number }>();
  for (const r of rows) {
    const top = topByExercise.get(r.exerciseId);
    if (!top || r.weightKg > top.weightKg || (r.weightKg === top.weightKg && r.reps > top.reps)) {
      topByExercise.set(r.exerciseId, { weightKg: r.weightKg, reps: r.reps });
    }
  }
  const names = new Map(
    topByExercise.size
      ? db
          .select({ id: exercises.id, name: exercises.name })
          .from(exercises)
          .where(inArray(exercises.id, [...topByExercise.keys()]))
          .all()
          .map((e) => [e.id, e.name])
      : [],
  );
  const summaryExercises: SummaryExercise[] = [];
  for (const [exerciseId, top] of topByExercise) {
    // The best of the COMPLETED sessions before this one, so a past session
    // shared later keeps its records; a first-ever session counts as one.
    const [best] = db
      .select({ weightKg: setLogs.weightKg })
      .from(setLogs)
      .innerJoin(workoutLogs, eq(workoutLogs.id, setLogs.workoutLogId))
      .where(
        and(
          eq(setLogs.exerciseId, exerciseId),
          eq(setLogs.isWarmup, false),
          eq(workoutLogs.status, 'completed'),
          ne(workoutLogs.id, logId),
          log ? lte(workoutLogs.startedAt, log.startedAt) : undefined,
        ),
      )
      .orderBy(desc(setLogs.weightKg))
      .limit(1)
      .all();
    summaryExercises.push({
      exerciseId,
      name: exerciseDisplayName(
        { id: exerciseId, name: names.get(exerciseId) ?? exerciseId },
        locale,
      ),
      topKg: top.weightKg,
      topReps: top.reps,
      isPr: !best || top.weightKg > best.weightKg,
    });
  }
  const missedSets = (log?.plannedSnapshot ?? []).reduce(
    (sum, p) => sum + (p.skipped ? plannedSets(p) : (p.skippedSets?.length ?? 0)),
    0,
  );
  return {
    volumeKg,
    setCount: rows.length,
    durationSeconds,
    prs: summaryExercises.filter((e) => e.isPr).map((e) => e.name),
    exercises: summaryExercises,
    missedSets,
  };
};

/* ── Suggested weight (progressive overload) ───────────────────────────────── */

/**
 * Suggest a working weight from the most recently logged working set of this
 * exercise in a completed session: estimate 1RM (Epley) then back-solve for
 * the target reps + RIR. Returns null when there's no history (the user enters
 * it manually).
 */
export const suggestedWeight = (
  exerciseId: string,
  targetReps: number,
  targetRir: number,
): number | null => {
  const [last] = db
    .select({ weightKg: setLogs.weightKg, reps: setLogs.reps })
    .from(setLogs)
    .innerJoin(workoutLogs, eq(workoutLogs.id, setLogs.workoutLogId))
    .where(
      and(
        eq(setLogs.exerciseId, exerciseId),
        eq(setLogs.isWarmup, false),
        eq(workoutLogs.status, 'completed'),
      ),
    )
    .orderBy(desc(setLogs.createdAt))
    .limit(1)
    .all();

  if (!last) return null;
  // A high-rep last set gives no usable estimate; let the user enter the load.
  const estimated1Rm = estimate1Rm(last.weightKg, last.reps);
  if (estimated1Rm == null) return null;
  return roundToPlate(weightForReps(estimated1Rm, targetReps + targetRir));
};
