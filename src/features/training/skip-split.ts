import type { SkipReason } from '@/db/schema';

import { dayQuery, markTrainingDay } from './adherence.repo';
import { daysQuery } from './authoring.repo';
import { activeEnrollmentQuery } from './enroll';
import { syncTrainingReminder } from './reminders';
import { plannedSplitForDate } from './schedule';
import { deleteWorkout, getWorkout } from './session.repo';

/**
 * Marking a calendar day missed, from the day sheet and the catch-up banner.
 * It is an ADHERENCE mark only: the planned split is not resolved and stays the
 * next split to train — the Train tab offers splits in order, so a missed
 * Monday split is simply trained on the next session. The mark carries which
 * split the day stood for, so the sheet can say what was carried over. A
 * `skipped` log that an older build wrote stays linked (it is still the undo
 * handle for that legacy resolution); nothing writes one any more.
 */
export const skipPlannedDay = (
  userId: string,
  date: string,
  skipReason: SkipReason | null,
): void => {
  const [enrollment] = activeEnrollmentQuery(userId).all();
  const days =
    enrollment?.status === 'active' && enrollment.currentRoutineId
      ? daysQuery(enrollment.currentRoutineId).all()
      : [];
  const split = plannedSplitForDate(days, date);
  const [existing] = dayQuery(userId, date).all();
  const legacyLog = existing?.status === 'skipped' ? (existing.workoutLogId ?? null) : null;
  markTrainingDay(userId, {
    date,
    status: 'skipped',
    skipReason,
    workoutLogId: legacyLog,
    workoutDayId: split?.id ?? existing?.workoutDayId ?? null,
  });
};

/**
 * Undo a legacy skip from its day: deletes the `skipped` log (which releases
 * the day and rewinds the program if that week is no longer resolved). Returns
 * whether there was a skip to undo.
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
