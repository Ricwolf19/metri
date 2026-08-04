import { and, asc, desc, eq, gte } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercises, setLogs, workoutLogs } from '@/db/schema';

import { localDateKey } from './adherence.repo';

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
