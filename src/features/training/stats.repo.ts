import { and, asc, eq, gte } from 'drizzle-orm';

import { db } from '@/db/client';
import { setLogs, workoutLogs } from '@/db/schema';

import { localDateKey } from './adherence.repo';

/**
 * Progress analytics derived from logged sets. Kept pure (returns plain data);
 * the UI maps it onto a chart. Volume = Σ(weight × reps) over working sets.
 */

export type WeekVolume = { weekStart: string; label: string; volume: number };

/** Monday of the local week containing `d`, as 'YYYY-MM-DD'. */
const weekStartKey = (d: Date): string => {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return localDateKey(monday);
};

/**
 * Total working-set volume per week for the last `weeks` weeks (oldest→newest),
 * including empty weeks so the trend line has no gaps.
 */
export const weeklyVolume = (userId: string, weeks = 8): WeekVolume[] => {
  const today = new Date();
  const firstMonday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  firstMonday.setDate(firstMonday.getDate() - ((firstMonday.getDay() + 6) % 7) - (weeks - 1) * 7);

  const rows = db
    .select({
      weightKg: setLogs.weightKg,
      reps: setLogs.reps,
      createdAt: setLogs.createdAt,
    })
    .from(setLogs)
    .innerJoin(workoutLogs, eq(workoutLogs.id, setLogs.workoutLogId))
    .where(
      and(
        eq(workoutLogs.userId, userId),
        eq(workoutLogs.status, 'completed'),
        eq(setLogs.isWarmup, false),
        gte(setLogs.createdAt, firstMonday),
      ),
    )
    .orderBy(asc(setLogs.createdAt))
    .all();

  // Seed every week bucket (incl. empty ones) so the chart shows a continuous trend.
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
