import { and, asc, desc, eq, gte, like, lte } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  trainingDays,
  userPrograms,
  type SkipReason,
  type TrainingDay,
  type TrainingDayStatus,
} from '@/db/schema';
import { randomId } from '@/lib/crypto';

import { localDateKey } from './dates';
import { streakFromEntries } from './streak';

/**
 * Adherence repo — the day-by-day consistency ledger behind the heatmap, streaks
 * and long-term progress. Days are keyed by a **device-local** 'YYYY-MM-DD' string
 * so a day never drifts across the UTC boundary; a unique (user, date) index makes
 * every write an idempotent upsert.
 */

export { dateFromKey, localDateKey } from './dates';

export type MarkDayInput = {
  /** Defaults to today. */
  date?: string;
  status: TrainingDayStatus;
  skipReason?: SkipReason | null;
  note?: string | null;
  workoutLogId?: string | null;
  workoutDayId?: string | null;
};

/** Record (or overwrite) the adherence entry for a day. */
export const markTrainingDay = (userId: string, input: MarkDayInput): TrainingDay => {
  const date = input.date ?? localDateKey();
  const skipReason = input.status === 'skipped' ? (input.skipReason ?? null) : null;
  const [row] = db
    .insert(trainingDays)
    .values({
      id: randomId(),
      userId,
      date,
      status: input.status,
      skipReason,
      note: input.note ?? null,
      workoutLogId: input.workoutLogId ?? null,
      workoutDayId: input.workoutDayId ?? null,
    })
    .onConflictDoUpdate({
      target: [trainingDays.userId, trainingDays.date],
      set: {
        status: input.status,
        skipReason,
        note: input.note ?? null,
        workoutLogId: input.workoutLogId ?? null,
        workoutDayId: input.workoutDayId ?? null,
        updatedAt: new Date(),
      },
    })
    .returning()
    .all();
  return row;
};

/** Live query of a single day's entry (drives the "mark today" widget). */
export const dayQuery = (userId: string, date: string) =>
  db
    .select()
    .from(trainingDays)
    .where(and(eq(trainingDays.userId, userId), eq(trainingDays.date, date)));

/** Live query of an inclusive date range (both 'YYYY-MM-DD') — the Home week strip. */
export const rangeDaysQuery = (userId: string, from: string, to: string) =>
  db
    .select()
    .from(trainingDays)
    .where(
      and(
        eq(trainingDays.userId, userId),
        gte(trainingDays.date, from),
        lte(trainingDays.date, to),
      ),
    )
    .orderBy(asc(trainingDays.date));

/** Live query of a month's entries for the heatmap. `yearMonth` is 'YYYY-MM'. */
export const monthDaysQuery = (userId: string, yearMonth: string) =>
  db
    .select()
    .from(trainingDays)
    .where(and(eq(trainingDays.userId, userId), like(trainingDays.date, `${yearMonth}-%`)))
    .orderBy(asc(trainingDays.date));

/** Planned weekdays of the active enrollment, or null (nothing enrolled / no schedule). */
export const getActiveTrainingWeekdays = (userId: string): number[] | null => {
  const [row] = db
    .select({ trainingWeekdays: userPrograms.trainingWeekdays })
    .from(userPrograms)
    .where(and(eq(userPrograms.userId, userId), eq(userPrograms.status, 'active')))
    .orderBy(desc(userPrograms.createdAt))
    .limit(1)
    .all();
  return row?.trainingWeekdays?.length ? row.trainingWeekdays : null;
};

/** Streak query wrapper — resolves entries + the enrolled schedule. */
export const computeStreak = (
  userId: string,
  plannedWeekdays: number[] | null,
  today: string = localDateKey(),
): number => {
  const rows = db
    .select({ date: trainingDays.date, status: trainingDays.status })
    .from(trainingDays)
    .where(and(eq(trainingDays.userId, userId), lte(trainingDays.date, today)))
    .orderBy(desc(trainingDays.date))
    .limit(400)
    .all();
  return streakFromEntries(new Map(rows.map((r) => [r.date, r.status])), plannedWeekdays, today);
};
