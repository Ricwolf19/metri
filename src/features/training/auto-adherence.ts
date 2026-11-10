import type { SkipReason, TrainingDayStatus } from '@/db/schema';

import { dateFromKey, localDateKey, weekdayOf } from './dates';

/** How many days after a missed planned day a session on an unplanned day still makes it up. */
const MOVED_GRACE_DAYS = 2;

/** What a day already carries, as far as the automatic marks care. */
export type DayMark = {
  status: TrainingDayStatus;
  skipReason: SkipReason | null;
  /** A legacy skip log: its undo handle, never rewritten. */
  workoutLogId: string | null;
};

type AutoMark = { date: string; kind: 'missed' | 'moved' };

/**
 * A miss written by `planAutoMarks` (or the catch-up's "all missed"): a planned
 * day nobody gave a reason for. Only these may still become "moved"; a reason
 * the lifter chose is their word on the day.
 */
export const isAutoMissed = (mark: DayMark | undefined): boolean =>
  mark?.status === 'skipped' && mark.skipReason == null && mark.workoutLogId == null;

/** A 'YYYY-MM-DD' key moved by whole days (local calendar, DST-safe). */
export const shiftDateKey = (key: string, days: number): string => {
  const d = dateFromKey(key);
  d.setDate(d.getDate() + days);
  return localDateKey(d);
};

/**
 * The calendar fills itself from the schedule: a PLANNED day that has passed
 * with nothing marked is missed, and a session finished on an unplanned day
 * within `MOVED_GRACE_DAYS` makes up the nearest open planned day before it —
 * that day becomes "moved" (a rest day, so the streak holds). Each session
 * makes up one day. Today is never marked: it is still being trained, and the
 * check-in asks about it. Unplanned days stay neutral. Pure; the writer is
 * `reconcileAutoAdherence`.
 */
export const planAutoMarks = (input: {
  /** Expo-numbered weekdays of the active enrollment. */
  plannedWeekdays: readonly number[];
  /** 'YYYY-MM-DD' the enrollment started: nothing before it is read. */
  from: string;
  /**
   * First day an EMPTY day may still be judged (defaults to `from`). Each day
   * is judged once, against the schedule of that moment: a later schedule
   * change must not write misses into weeks that were already settled.
   */
  judgeFrom?: string;
  today: string;
  marks: ReadonlyMap<string, DayMark>;
}): AutoMark[] => {
  const { from, today, marks } = input;
  const judgeFrom = input.judgeFrom && input.judgeFrom > from ? input.judgeFrom : from;
  const planned = new Set(input.plannedWeekdays);
  if (!planned.size || from > today) return [];
  const isPlanned = (key: string) => planned.has(weekdayOf(dateFromKey(key)));
  const open = (key: string) =>
    key >= from &&
    key < today &&
    isPlanned(key) &&
    (marks.has(key) ? isAutoMissed(marks.get(key)) : key >= judgeFrom);

  const days: string[] = [];
  for (let key = from; key <= today; key = shiftDateKey(key, 1)) days.push(key);

  const moved = new Set<string>();
  for (const key of days) {
    if (isPlanned(key) || marks.get(key)?.status !== 'trained') continue;
    for (let back = 1; back <= MOVED_GRACE_DAYS; back++) {
      const prev = shiftDateKey(key, -back);
      if (open(prev) && !moved.has(prev)) {
        moved.add(prev);
        break;
      }
    }
  }

  return days.flatMap((key): AutoMark[] => {
    if (moved.has(key)) return [{ date: key, kind: 'moved' }];
    return open(key) && !marks.has(key) ? [{ date: key, kind: 'missed' }] : [];
  });
};
