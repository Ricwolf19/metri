import type { SkipReason, UserProgram } from '@/db/schema';

import { dayQuery, markTrainingDay } from './adherence.repo';
import { daysQuery } from './authoring.repo';
import { dateFromKey, localDateKey, weekdayOf } from './dates';
import { activeEnrollmentQuery } from './enroll';
import { syncTrainingReminder } from './reminders';
import { plannedSplitForDate, type ScheduledDay } from './schedule';
import { completedDaysQuery, deleteWorkout, getWorkout, skipWorkout } from './session.repo';

/**
 * Skipping a planned split, from the three places a lifter says "not this
 * one": the day sheet and the catch-up banner (a calendar DAY), and the Train
 * tab (a SPLIT). All three end in `skipWorkout`, which writes the `skipped`
 * log that lets the week resolve. The week stamp is always the current one:
 * the cursor cannot move past a week with an unresolved split, so the only
 * unresolved planned split in the current phase IS the current week's — a
 * catch-up answer about a day three weeks old still says "the plan moves on".
 * A day whose split is already resolved (or that maps to none) keeps today's
 * behaviour: an adherence-only mark.
 */

type Resolution = { advanced: boolean };

const activeEnrollment = (userId: string): UserProgram | null => {
  const [enrollment] = activeEnrollmentQuery(userId).all();
  return enrollment?.status === 'active' ? enrollment : null;
};

const resolvedDayIds = (enrollment: UserProgram): ReadonlySet<string> =>
  new Set(
    completedDaysQuery(enrollment.id, enrollment.currentWeek)
      .all()
      .map((r) => r.dayId),
  );

/** Mark a calendar day skipped; when it is this week's unresolved planned split, resolve the week too. */
export const skipPlannedDay = (
  userId: string,
  date: string,
  skipReason: SkipReason | null,
): Resolution => {
  const enrollment = activeEnrollment(userId);
  const days = enrollment?.currentRoutineId ? daysQuery(enrollment.currentRoutineId).all() : [];
  const split = plannedSplitForDate(days, date);
  if (!enrollment || !split || resolvedDayIds(enrollment).has(split.id)) {
    // Re-marking a day whose skip already carries a log keeps the link: it is
    // the undo handle, and a new reason must not drop it.
    const [existing] = dayQuery(userId, date).all();
    const keep =
      existing?.status === 'skipped' && existing.workoutLogId
        ? { workoutLogId: existing.workoutLogId, workoutDayId: existing.workoutDayId }
        : {};
    markTrainingDay(userId, { date, status: 'skipped', skipReason, ...keep });
    return { advanced: false };
  }
  const { advanced } = skipWorkout({
    userId,
    userProgramId: enrollment.id,
    workoutDayId: split.id,
    weekNumber: enrollment.currentWeek,
    skipReason,
    date,
  });
  if (advanced) void syncTrainingReminder(userId);
  return { advanced };
};

/** The most recent calendar day (today or earlier) that falls on the split's weekday. */
const lastOccurrence = (day: Pick<ScheduledDay, 'weekday'>, today: string): string => {
  if (day.weekday == null) return today;
  const cursor = dateFromKey(today);
  for (let i = 0; i < 7; i++) {
    if (weekdayOf(cursor) === day.weekday) return localDateKey(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }
  return today;
};

/** Skip a split from the plan itself; the adherence mark lands on its last occurrence unless that day was trained. */
export const skipSplitFromPlan = (
  userId: string,
  enrollment: UserProgram,
  day: ScheduledDay,
  skipReason: SkipReason | null,
  today = localDateKey(),
): Resolution => {
  const date = lastOccurrence(day, today);
  const [existing] = dayQuery(userId, date).all();
  const { advanced } = skipWorkout({
    userId,
    userProgramId: enrollment.id,
    workoutDayId: day.id,
    weekNumber: enrollment.currentWeek,
    skipReason,
    date: existing?.status === 'trained' ? null : date,
  });
  if (advanced) void syncTrainingReminder(userId);
  return { advanced };
};

/**
 * Undo a skip from its day: deletes the `skipped` log (which releases the day
 * and rewinds the program if that week is no longer resolved). Returns whether
 * there was a skip to undo.
 */
export const unskipDay = (userId: string, date: string): boolean => {
  const [day] = dayQuery(userId, date).all();
  if (!day?.workoutLogId) return false;
  const log = getWorkout(day.workoutLogId);
  if (log?.status !== 'skipped') return false;
  const rewound = deleteWorkout(log.id);
  if (rewound) void syncTrainingReminder(userId);
  return true;
};
