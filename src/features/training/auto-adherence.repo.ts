import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { appMeta } from '@/db/schema';

import { dateFromKey, localDateKey, markTrainingDay, rangeDaysQuery } from './adherence.repo';
import { planAutoMarks, shiftDateKey } from './auto-adherence';
import { CATCHUP_DAYS_BACK } from './catchup-gaps';
import { activeEnrollmentQuery } from './enroll';
import { skipPlannedDay } from './skip-split';

/** Local-only bookmark (`app_meta` never syncs): the last day already judged for this user. */
const judgedThroughKey = (userId: string) => `auto_adherence_through:${userId}`;

const readJudgedThrough = (userId: string): string | null =>
  db
    .select()
    .from(appMeta)
    .where(eq(appMeta.key, judgedThroughKey(userId)))
    .all()[0]?.value ?? null;

const writeJudgedThrough = (userId: string, date: string): void => {
  db.insert(appMeta)
    .values({ key: judgedThroughKey(userId), value: date })
    .onConflictDoUpdate({ target: appMeta.key, set: { value: date, updatedAt: new Date() } })
    .run();
};

/**
 * Write the calendar's automatic marks (`planAutoMarks`) for the active
 * enrollment: passed planned days with nothing logged become missed, and one
 * made up within the grace days becomes "moved" (rest). Only empty days and
 * automatic misses are ever written, so a mark the lifter chose is never
 * touched. Each empty day is judged ONCE (a bookmark; the first run looks back
 * at most `CATCHUP_DAYS_BACK`), so a schedule change never rewrites settled
 * weeks, and every automatic mark is stamped at the start of its own day, so
 * it stays on this device and loses to any real answer under sync's
 * last-write-wins. Returns how many days changed.
 */
export const reconcileAutoAdherence = (userId: string, today = localDateKey()): number => {
  // An empty id reads back nothing, and writing on that answer is data loss (AGENTS.md).
  if (!userId) return 0;
  const [enrollment] = activeEnrollmentQuery(userId).all();
  if (enrollment?.status !== 'active' || !enrollment.trainingWeekdays?.length) return 0;
  const from = localDateKey(new Date(enrollment.startedAt ?? enrollment.createdAt));
  const judgedThrough = readJudgedThrough(userId);
  const judgeFrom = judgedThrough
    ? shiftDateKey(judgedThrough, 1)
    : shiftDateKey(today, -CATCHUP_DAYS_BACK);
  const marks = new Map(
    rangeDaysQuery(userId, from, today)
      .all()
      .map((d) => [
        d.date,
        {
          status: d.status,
          skipReason: d.skipReason ?? null,
          workoutLogId: d.workoutLogId ?? null,
        },
      ]),
  );
  const plan = planAutoMarks({
    plannedWeekdays: enrollment.trainingWeekdays,
    from,
    judgeFrom,
    today,
    marks,
  });
  for (const mark of plan) {
    const stampedAt = dateFromKey(mark.date);
    if (mark.kind === 'missed') skipPlannedDay(userId, mark.date, null, stampedAt);
    else
      markTrainingDay(userId, {
        date: mark.date,
        status: 'rest',
        skipReason: 'moved',
        stampedAt,
      });
  }
  const yesterday = shiftDateKey(today, -1);
  if (!judgedThrough || yesterday > judgedThrough) writeJudgedThrough(userId, yesterday);
  return plan.length;
};
