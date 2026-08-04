import { and, eq, gte, lt } from 'drizzle-orm';

import { db } from '@/db/client';
import { setLogs, users, workoutDays, workoutLogs } from '@/db/schema';

/**
 * Everything the app recorded on a calendar day — the data behind the day
 * detail sheet. Extensible by design: future feeds (weigh-ins, measurements)
 * add a field here + a block in the sheet, nothing else changes.
 */
type WorkoutDaySummary = {
  logId: string;
  dayName: string;
  durationSeconds: number | null;
  setCount: number;
  volumeKg: number;
};

export type DayDetail = {
  workouts: WorkoutDaySummary[];
  /** TDEE/BMR was computed this day. */
  tdeeComputed: boolean;
};

const dayRange = (dateKey: string): [Date, Date] => {
  const [y, m, d] = dateKey.split('-').map(Number);
  return [new Date(y, m - 1, d), new Date(y, m - 1, d + 1)];
};

export const getDayDetail = (userId: string, dateKey: string): DayDetail => {
  const [start, end] = dayRange(dateKey);

  const logs = db
    .select({ log: workoutLogs, day: workoutDays })
    .from(workoutLogs)
    .leftJoin(workoutDays, eq(workoutDays.id, workoutLogs.workoutDayId))
    .where(
      and(
        eq(workoutLogs.userId, userId),
        eq(workoutLogs.status, 'completed'),
        gte(workoutLogs.completedAt, start),
        lt(workoutLogs.completedAt, end),
      ),
    )
    .all();

  const workouts: WorkoutDaySummary[] = logs.map(({ log, day }) => {
    const sets = db
      .select()
      .from(setLogs)
      .where(and(eq(setLogs.workoutLogId, log.id), eq(setLogs.isWarmup, false)))
      .all();
    return {
      logId: log.id,
      dayName: day?.name ?? '—',
      durationSeconds: log.durationSeconds,
      setCount: sets.length,
      volumeKg: Math.round(sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0)),
    };
  });

  const [u] = db
    .select({ bmrComputedAt: users.bmrComputedAt })
    .from(users)
    .where(eq(users.id, userId))
    .all();
  const tdeeComputed = !!u?.bmrComputedAt && u.bmrComputedAt >= start && u.bmrComputedAt < end;

  return { workouts, tdeeComputed };
};
