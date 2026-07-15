import { and, asc, desc, eq, like, lte } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  trainingDays,
  type SkipReason,
  type TrainingDay,
  type TrainingDayStatus,
} from '@/db/schema';
import { recordDeletion } from '@/features/sync/tombstones';
import { randomId } from '@/lib/crypto';

/**
 * Adherence repo — the day-by-day consistency ledger behind the heatmap, streaks
 * and long-term progress. Days are keyed by a **device-local** 'YYYY-MM-DD' string
 * so a day never drifts across the UTC boundary; a unique (user, date) index makes
 * every write an idempotent upsert.
 */

/** Device-local calendar day as 'YYYY-MM-DD'. */
export const localDateKey = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Parse a 'YYYY-MM-DD' key back to a local-midnight Date (no UTC shift). */
const dateFromKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

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

/** Remove a day's entry (undo). */
export const clearTrainingDay = (userId: string, date: string): void => {
  const [row] = db
    .select({ id: trainingDays.id })
    .from(trainingDays)
    .where(and(eq(trainingDays.userId, userId), eq(trainingDays.date, date)))
    .all();
  db.delete(trainingDays)
    .where(and(eq(trainingDays.userId, userId), eq(trainingDays.date, date)))
    .run();
  if (row) recordDeletion('training_days', row.id);
};

/** Live query of a single day's entry (drives the "mark today" widget). */
export const dayQuery = (userId: string, date: string) =>
  db
    .select()
    .from(trainingDays)
    .where(and(eq(trainingDays.userId, userId), eq(trainingDays.date, date)));

/** Live query of a month's entries for the heatmap. `yearMonth` is 'YYYY-MM'. */
export const monthDaysQuery = (userId: string, yearMonth: string) =>
  db
    .select()
    .from(trainingDays)
    .where(and(eq(trainingDays.userId, userId), like(trainingDays.date, `${yearMonth}-%`)))
    .orderBy(asc(trainingDays.date));

/**
 * Current consistency streak ending today: consecutive days you **trained**, with
 * `rest` days treated as neutral (neither extend nor break it) and a `skipped`
 * day or an unlogged gap ending it. Today may be empty (not logged yet) without
 * breaking the streak carried from yesterday.
 */
export const computeStreak = (userId: string, today: string = localDateKey()): number => {
  const rows = db
    .select({ date: trainingDays.date, status: trainingDays.status })
    .from(trainingDays)
    .where(and(eq(trainingDays.userId, userId), lte(trainingDays.date, today)))
    .orderBy(desc(trainingDays.date))
    .limit(400)
    .all();

  const byDate = new Map(rows.map((r) => [r.date, r.status]));
  const cursor = dateFromKey(today);
  let streak = 0;
  let first = true;

  for (let i = 0; i < 400; i++) {
    const status = byDate.get(localDateKey(cursor));
    if (status === 'trained') streak++;
    else if (status === 'rest') {
      /* neutral — keep walking back */
    } else if (!(first && status === undefined)) {
      // A missed (skipped) day or a gap ends the streak — but today may be blank.
      break;
    }
    first = false;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};
