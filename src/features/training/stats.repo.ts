import { and, asc, desc, eq, gte, inArray } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercises, setLogs, workoutLogs } from '@/db/schema';

import { localDateKey } from './adherence.repo';
import { sessionAdherence, type EffortAdherence, type EffortSet } from './effort-stats';
import type { LoadedSet, MuscleIndex } from './muscle-load';

export type WeekVolume = { weekStart: string; label: string; volume: number };

/** "MM/DD" chart label for a week-start date key. */
const weekLabel = (weekStart: string): string => weekStart.slice(5).replace('-', '/');

const weekStartKey = (d: Date): string => {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return localDateKey(monday);
};

const firstMondayFor = (weeks: number): Date => {
  const today = new Date();
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - (weeks - 1) * 7);
  return d;
};

export type VolumeSet = { weightKg: number; reps: number; createdAt: Date };

export const weeklyVolumeQuery = (userId: string, weeks = 8) =>
  db
    .select({ weightKg: setLogs.weightKg, reps: setLogs.reps, createdAt: setLogs.createdAt })
    .from(setLogs)
    .innerJoin(workoutLogs, eq(workoutLogs.id, setLogs.workoutLogId))
    .where(
      and(
        eq(workoutLogs.userId, userId),
        eq(workoutLogs.status, 'completed'),
        eq(setLogs.isWarmup, false),
        gte(setLogs.createdAt, firstMondayFor(weeks)),
      ),
    )
    .orderBy(asc(setLogs.createdAt));

export const bucketVolume = (rows: VolumeSet[], weeks = 8): WeekVolume[] => {
  const firstMonday = firstMondayFor(weeks);
  const buckets = new Map<string, number>();
  for (let i = 0; i < weeks; i++) {
    const d = new Date(firstMonday);
    d.setDate(d.getDate() + i * 7);
    buckets.set(localDateKey(d), 0);
  }
  for (const r of rows) {
    const key = weekStartKey(r.createdAt);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + r.weightKg * r.reps);
  }
  return [...buckets.entries()].map(([weekStart, volume]) => ({
    weekStart,
    label: weekLabel(weekStart),
    volume: Math.round(volume),
  }));
};

export type ExerciseSession = {
  logId: string;
  completedAt: Date;
  sets: { weightKg: number; reps: number }[];
};

/** All completed working sets of one exercise, grouped per session, newest first. */
export const exerciseHistory = (userId: string, exerciseId: string): ExerciseSession[] => {
  const rows = db
    .select({
      logId: workoutLogs.id,
      completedAt: workoutLogs.completedAt,
      weightKg: setLogs.weightKg,
      reps: setLogs.reps,
    })
    .from(setLogs)
    .innerJoin(workoutLogs, eq(workoutLogs.id, setLogs.workoutLogId))
    .where(
      and(
        eq(workoutLogs.userId, userId),
        eq(workoutLogs.status, 'completed'),
        eq(setLogs.exerciseId, exerciseId),
        eq(setLogs.isWarmup, false),
      ),
    )
    .orderBy(desc(workoutLogs.completedAt), asc(setLogs.setNumber))
    .all();

  const sessions: ExerciseSession[] = [];
  for (const r of rows) {
    const set = { weightKg: r.weightKg, reps: r.reps };
    const last = sessions[sessions.length - 1];
    if (last?.logId === r.logId) last.sets.push(set);
    else sessions.push({ logId: r.logId, completedAt: r.completedAt ?? new Date(0), sets: [set] });
  }
  return sessions;
};

export type TopSetWeek = { weekStart: string; label: string; topKg: number };

/** Heaviest working set per calendar week, oldest → newest (last `weeks`). */
export const topSetByWeek = (sessions: ExerciseSession[], weeks = 8): TopSetWeek[] => {
  const buckets = new Map<string, number>();
  for (const s of sessions) {
    const key = weekStartKey(s.completedAt);
    const top = Math.max(...s.sets.map((x) => x.weightKg));
    buckets.set(key, Math.max(buckets.get(key) ?? 0, top));
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-weeks)
    .map(([weekStart, topKg]) => ({ weekStart, label: weekLabel(weekStart), topKg }));
};

export type LoggedExercise = { exerciseId: string; name: string; sessions: number };

/** Exercises with logged working sets, most recently trained first. */
export const loggedExercises = (userId: string): LoggedExercise[] => {
  const rows = db
    .select({
      exerciseId: setLogs.exerciseId,
      name: exercises.name,
      logId: setLogs.workoutLogId,
      completedAt: workoutLogs.completedAt,
    })
    .from(setLogs)
    .innerJoin(workoutLogs, eq(workoutLogs.id, setLogs.workoutLogId))
    .innerJoin(exercises, eq(exercises.id, setLogs.exerciseId))
    .where(
      and(
        eq(workoutLogs.userId, userId),
        eq(workoutLogs.status, 'completed'),
        eq(setLogs.isWarmup, false),
      ),
    )
    .all();

  const byExercise = new Map<string, { name: string; logs: Set<string>; last: number }>();
  for (const r of rows) {
    const entry = byExercise.get(r.exerciseId) ?? {
      name: r.name,
      logs: new Set<string>(),
      last: 0,
    };
    entry.logs.add(r.logId);
    entry.last = Math.max(entry.last, r.completedAt?.getTime() ?? 0);
    byExercise.set(r.exerciseId, entry);
  }
  return [...byExercise.entries()]
    .sort(([, a], [, b]) => b.last - a.last)
    .map(([exerciseId, e]) => ({ exerciseId, name: e.name, sessions: e.logs.size }));
};

/* ── Body-map + trend inputs ─────────────────────────────────────────────── */

/** exerciseId → muscle attribution, for {@link muscleLoadFor}. Small table, so
 * it is read whole rather than joined per set. */
export const muscleIndex = (): MuscleIndex =>
  new Map(
    db
      .select({
        id: exercises.id,
        primary: exercises.primaryMuscles,
        secondary: exercises.secondaryMuscles,
        category: exercises.category,
      })
      .from(exercises)
      .all()
      .map((e) => [e.id, { primary: e.primary, secondary: e.secondary, category: e.category }]),
  );

/** Completed working sets since `since`, shaped for the pure muscle models. */
export const loadedSets = (userId: string, since: Date): LoadedSet[] =>
  db
    .select({
      exerciseId: setLogs.exerciseId,
      reps: setLogs.reps,
      weightKg: setLogs.weightKg,
      rir: setLogs.rir,
      isFailure: setLogs.isFailure,
      createdAt: setLogs.createdAt,
    })
    .from(setLogs)
    .innerJoin(workoutLogs, eq(workoutLogs.id, setLogs.workoutLogId))
    .where(
      and(
        eq(workoutLogs.userId, userId),
        eq(workoutLogs.status, 'completed'),
        eq(setLogs.isWarmup, false),
        gte(setLogs.createdAt, since),
      ),
    )
    .all()
    .map((r) => ({
      exerciseId: r.exerciseId,
      reps: r.reps,
      weightKg: r.weightKg,
      rir: r.rir,
      isFailure: r.isFailure,
      at: r.createdAt.getTime(),
    }));

export type WorkoutCounts = { total: number; thisMonth: number };

export const workoutCounts = (userId: string): WorkoutCounts => {
  const rows = db
    .select({ completedAt: workoutLogs.completedAt })
    .from(workoutLogs)
    .where(and(eq(workoutLogs.userId, userId), eq(workoutLogs.status, 'completed')))
    .all();
  const month = localDateKey().slice(0, 7);
  return {
    total: rows.length,
    thisMonth: rows.filter((r) => r.completedAt && localDateKey(r.completedAt).startsWith(month))
      .length,
  };
};

export type MonthCount = { month: string; label: string; count: number };

/** Completed sessions per calendar month, oldest → newest, zero-filled. */
export const monthlyWorkouts = (userId: string, months = 6): MonthCount[] => {
  const rows = db
    .select({ completedAt: workoutLogs.completedAt })
    .from(workoutLogs)
    .where(and(eq(workoutLogs.userId, userId), eq(workoutLogs.status, 'completed')))
    .all();

  const buckets = new Map<string, number>();
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.set(localDateKey(d).slice(0, 7), 0);
  }
  for (const r of rows) {
    if (!r.completedAt) continue;
    const key = localDateKey(r.completedAt).slice(0, 7);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([month, count]) => ({
    month,
    label: month.slice(5),
    count,
  }));
};

export type RecentWorkout = {
  id: string;
  completedAt: Date | null;
  durationSeconds: number | null;
  volumeKg: number;
  setCount: number;
};

/** Newest completed sessions with their working volume, for the activity list. */
export const recentWorkouts = (userId: string, limit = 5): RecentWorkout[] => {
  const logs = db
    .select({
      id: workoutLogs.id,
      completedAt: workoutLogs.completedAt,
      durationSeconds: workoutLogs.durationSeconds,
    })
    .from(workoutLogs)
    .where(and(eq(workoutLogs.userId, userId), eq(workoutLogs.status, 'completed')))
    .orderBy(desc(workoutLogs.completedAt))
    .limit(limit)
    .all();
  if (!logs.length) return [];

  const sets = db
    .select({
      workoutLogId: setLogs.workoutLogId,
      weightKg: setLogs.weightKg,
      reps: setLogs.reps,
    })
    .from(setLogs)
    .where(
      and(
        inArray(
          setLogs.workoutLogId,
          logs.map((l) => l.id),
        ),
        eq(setLogs.isWarmup, false),
      ),
    )
    .all();

  return logs.map((log) => {
    const own = sets.filter((s) => s.workoutLogId === log.id);
    return {
      ...log,
      setCount: own.length,
      volumeKg: Math.round(own.reduce((sum, s) => sum + s.weightKg * s.reps, 0)),
    };
  });
};

/** exerciseId → display name, for the muscle drilldown. */
export const exerciseNames = (): ReadonlyMap<string, string> =>
  new Map(
    db
      .select({ id: exercises.id, name: exercises.name })
      .from(exercises)
      .all()
      .map((e) => [e.id, e.name]),
  );

/**
 * Planned-vs-actual intensity across recent sessions, summed. Each session is
 * scored against ITS OWN snapshot, so a later program edit never rewrites
 * history.
 */
export const effortSummary = (userId: string, since: Date): EffortAdherence => {
  const logs = db
    .select({ id: workoutLogs.id, plannedSnapshot: workoutLogs.plannedSnapshot })
    .from(workoutLogs)
    .where(
      and(
        eq(workoutLogs.userId, userId),
        eq(workoutLogs.status, 'completed'),
        gte(workoutLogs.startedAt, since),
      ),
    )
    .all();

  const total: EffortAdherence = { on_target: 0, easy: 0, hard: 0, unknown: 0, total: 0 };
  if (!logs.length) return total;

  const sets = db
    .select({
      workoutLogId: setLogs.workoutLogId,
      exerciseId: setLogs.exerciseId,
      rir: setLogs.rir,
      isFailure: setLogs.isFailure,
    })
    .from(setLogs)
    .where(
      and(
        inArray(
          setLogs.workoutLogId,
          logs.map((l) => l.id),
        ),
        eq(setLogs.isWarmup, false),
      ),
    )
    .orderBy(asc(setLogs.setNumber))
    .all();

  for (const log of logs) {
    const own = sets.filter((s) => s.workoutLogId === log.id);
    const result = sessionAdherence(log.plannedSnapshot, own);
    for (const key of ['on_target', 'easy', 'hard', 'unknown', 'total'] as const) {
      total[key] += result[key];
    }
  }
  return total;
};

/** Working sets in the window, for hard-set and average-RIR tiles. */
export const effortSets = (userId: string, since: Date): EffortSet[] =>
  db
    .select({
      exerciseId: setLogs.exerciseId,
      rir: setLogs.rir,
      isFailure: setLogs.isFailure,
    })
    .from(setLogs)
    .innerJoin(workoutLogs, eq(workoutLogs.id, setLogs.workoutLogId))
    .where(
      and(
        eq(workoutLogs.userId, userId),
        eq(workoutLogs.status, 'completed'),
        eq(setLogs.isWarmup, false),
        gte(setLogs.createdAt, since),
      ),
    )
    .all();
