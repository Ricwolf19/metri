import { and, asc, eq, gte, lt, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercises, setLogs, users, workoutDays, workoutLogs } from '@/db/schema';

/**
 * Everything the app recorded on a calendar day — the data behind the day
 * detail sheet. Extensible by design: future feeds (weigh-ins, measurements)
 * add a field here + a block in the sheet, nothing else changes.
 */
export type LoggedSet = {
  setNumber: number;
  weightKg: number;
  reps: number;
  rir: number | null;
  rpe: number | null;
  isFailure: boolean;
};

type LoggedExercise = { exerciseId: string; name: string; sets: LoggedSet[] };

type WorkoutDaySummary = {
  logId: string;
  dayName: string;
  durationSeconds: number | null;
  setCount: number;
  volumeKg: number;
  /** Working sets grouped by exercise, in logging order. */
  exercises: LoggedExercise[];
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
      .select({ set: setLogs, exerciseName: exercises.name })
      .from(setLogs)
      .leftJoin(exercises, eq(exercises.id, setLogs.exerciseId))
      .where(and(eq(setLogs.workoutLogId, log.id), eq(setLogs.isWarmup, false)))
      // Set numbers restart per exercise, so insertion order (rowid) is the
      // only tie-break that keeps exercises in the order they were logged.
      .orderBy(asc(setLogs.createdAt), sql`${setLogs}.rowid`)
      .all();
    const byExercise = new Map<string, LoggedExercise>();
    for (const { set, exerciseName } of sets) {
      const entry = byExercise.get(set.exerciseId) ?? {
        exerciseId: set.exerciseId,
        name: exerciseName ?? '—',
        sets: [],
      };
      entry.sets.push({
        setNumber: set.setNumber,
        weightKg: set.weightKg,
        reps: set.reps,
        rir: set.rir,
        rpe: set.rpe,
        isFailure: set.isFailure,
      });
      byExercise.set(set.exerciseId, entry);
    }
    return {
      logId: log.id,
      dayName: day?.name ?? '—',
      durationSeconds: log.durationSeconds,
      setCount: sets.length,
      volumeKg: Math.round(sets.reduce((sum, { set }) => sum + set.weightKg * set.reps, 0)),
      exercises: [...byExercise.values()],
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
