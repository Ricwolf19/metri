import { and, asc, desc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  exercises,
  setLogs,
  weekConfigs,
  workoutDayExercises,
  workoutLogs,
  type Exercise,
  type PlannedSlot,
  type SetGroup,
  type SetLog,
  type WeekConfig,
  type WorkoutDayExercise,
  type WorkoutLog,
} from '@/db/schema';
import { randomId } from '@/lib/crypto';

import { recordDeletion } from '@/features/sync/tombstones';

import { localDateKey, markTrainingDay } from './adherence.repo';
import { advanceUserProgram } from './enroll';
import { roundToPlate } from './progression';

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
): WorkoutLog => {
  const plannedSnapshot: PlannedSlot[] = getSessionSlots(workoutDayId, weekNumber).map(
    ({ slot, exercise, config }) => ({
      slotId: slot.id,
      exerciseId: exercise.id,
      name: exercise.name,
      setGroups: expandPrescription(config),
      restSeconds: config?.restSeconds ?? slot.defaultRestSeconds ?? null,
      badges: slot.badges ?? [],
      alternativeExerciseIds: slot.alternativeExerciseIds ?? [],
    }),
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

/** Discard a session and its sets (used to cancel a started-by-mistake workout). */
export const abandonWorkout = (id: string): void => {
  const setIds = db
    .select({ id: setLogs.id })
    .from(setLogs)
    .where(eq(setLogs.workoutLogId, id))
    .all()
    .map((r) => r.id);
  db.delete(setLogs).where(eq(setLogs.workoutLogId, id)).run();
  recordDeletion('set_logs', setIds);
  db.update(workoutLogs)
    .set({ status: 'abandoned', updatedAt: new Date() })
    .where(eq(workoutLogs.id, id))
    .run();
};

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
    })
    .returning()
    .all();
  return row;
};

export const deleteSet = (id: string): void => {
  db.delete(setLogs).where(eq(setLogs.id, id)).run();
  recordDeletion('set_logs', id);
};

/** The non-warmup sets logged for this exercise+day in a previous week — the
 * prefill source ("what did I lift last week?"). */
export const lastWeekSets = (
  exerciseId: string,
  workoutDayId: string,
  weekNumber: number,
): SetLog[] => {
  if (weekNumber < 1) return [];
  const [prior] = db
    .select({ id: workoutLogs.id })
    .from(workoutLogs)
    .where(
      and(
        eq(workoutLogs.workoutDayId, workoutDayId),
        eq(workoutLogs.weekNumber, weekNumber),
        eq(workoutLogs.status, 'completed'),
      ),
    )
    .orderBy(desc(workoutLogs.completedAt))
    .limit(1)
    .all();
  if (!prior) return [];
  return db
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
};

/** Swap a snapshot slot to an alternative exercise for THIS session only. */
export const swapSnapshotExercise = (
  logId: string,
  slotId: string,
  exerciseId: string,
  exerciseName: string,
): void => {
  const log = getWorkout(logId);
  if (!log?.plannedSnapshot) return;
  const next = log.plannedSnapshot.map((p) =>
    p.slotId === slotId ? { ...p, exerciseId, name: exerciseName } : p,
  );
  db.update(workoutLogs)
    .set({ plannedSnapshot: next, updatedAt: new Date() })
    .where(eq(workoutLogs.id, logId))
    .run();
};

export type SessionSummary = {
  volumeKg: number;
  setCount: number;
  durationSeconds: number;
  prs: string[];
};

/** Post-workout summary: volume, working sets, duration, and simple PRs (a
 * session top weight beating everything logged before it). */
export const sessionSummary = (logId: string): SessionSummary => {
  const log = getWorkout(logId);
  const rows = db
    .select()
    .from(setLogs)
    .where(and(eq(setLogs.workoutLogId, logId), eq(setLogs.isWarmup, false)))
    .all();
  const volumeKg = Math.round(rows.reduce((sum, r) => sum + r.weightKg * r.reps, 0));
  const durationSeconds = log
    ? Math.max(0, Math.round((Date.now() - log.startedAt.getTime()) / 1000))
    : 0;

  const prs: string[] = [];
  const byExercise = new Map<string, number>();
  for (const r of rows) {
    byExercise.set(r.exerciseId, Math.max(byExercise.get(r.exerciseId) ?? 0, r.weightKg));
  }
  for (const [exerciseId, top] of byExercise) {
    const [best] = db
      .select({ weightKg: setLogs.weightKg })
      .from(setLogs)
      .innerJoin(workoutLogs, eq(workoutLogs.id, setLogs.workoutLogId))
      .where(
        and(
          eq(setLogs.exerciseId, exerciseId),
          eq(setLogs.isWarmup, false),
          eq(workoutLogs.status, 'completed'),
        ),
      )
      .orderBy(desc(setLogs.weightKg))
      .limit(1)
      .all();
    if (!best || top > best.weightKg) {
      const [ex] = db
        .select({ name: exercises.name })
        .from(exercises)
        .where(eq(exercises.id, exerciseId))
        .all();
      if (ex) prs.push(ex.name);
    }
  }
  return { volumeKg, setCount: rows.length, durationSeconds, prs };
};

/* ── Suggested weight (progressive overload) ───────────────────────────────── */

/**
 * Suggest a working weight from the last completed session's heaviest top set
 * for this exercise: estimate 1RM (Epley) then back-solve for the target reps +
 * RIR. Returns null when there's no history (the user enters it manually).
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
    .all();

  if (!last) return null;
  const estimated1Rm = last.weightKg * (1 + last.reps / 30);
  const totalReps = targetReps + targetRir;
  return roundToPlate(estimated1Rm / (1 + totalReps / 30));
};
