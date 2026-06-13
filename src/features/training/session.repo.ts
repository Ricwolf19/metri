import { and, asc, desc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  exercises,
  setLogs,
  weekConfigs,
  workoutDayExercises,
  workoutLogs,
  type Exercise,
  type SetLog,
  type WeekConfig,
  type WorkoutDayExercise,
  type WorkoutLog,
} from '@/db/schema';
import { randomId } from '@/lib/crypto';

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

/** Begin a session for a workout day at a routine-relative week. */
export const startWorkout = (
  userId: string,
  userProgramId: string,
  workoutDayId: string,
  weekNumber: number,
): WorkoutLog => {
  const [row] = db
    .insert(workoutLogs)
    .values({
      id: randomId(),
      userId,
      userProgramId,
      workoutDayId,
      weekNumber,
      status: 'in_progress',
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
    })
    .where(eq(workoutLogs.id, id))
    .run();
};

/** Discard a session and its sets (used to cancel a started-by-mistake workout). */
export const abandonWorkout = (id: string): void => {
  db.delete(setLogs).where(eq(setLogs.workoutLogId, id)).run();
  db.update(workoutLogs).set({ status: 'abandoned' }).where(eq(workoutLogs.id, id)).run();
};

/* ── Session exercises (slot + exercise + this week's prescription) ────────── */

export type SessionSlot = {
  slot: WorkoutDayExercise;
  exercise: Exercise;
  config: WeekConfig | null;
};

export const getSessionSlots = (workoutDayId: string, weekNumber: number): SessionSlot[] =>
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
