import { and, asc, eq, gte } from 'drizzle-orm';

import { db } from '@/db/client';
import { setLogs, workoutLogs } from '@/db/schema';

import { localDateKey } from './adherence.repo';

export type WeekVolume = { weekStart: string; label: string; volume: number };

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
    label: weekStart.slice(5).replace('-', '/'), // "MM/DD"
    volume: Math.round(volume),
  }));
};
