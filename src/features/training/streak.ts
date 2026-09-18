import type { TrainingDayStatus } from '@/db/schema';

import { dateFromKey, localDateKey, weekdayOf } from './dates';

/** Consecutive trained days ending `today` (rule: @see AGENTS.md#conventions, Adherence).
 * Today may be blank without breaking yesterday's carry. */
export const streakFromEntries = (
  byDate: Map<string, TrainingDayStatus>,
  plannedWeekdays: number[] | null,
  today: string,
): number => {
  const cursor = dateFromKey(today);
  let streak = 0;
  let first = true;

  for (let i = 0; i < 400; i++) {
    const status = byDate.get(localDateKey(cursor));
    const planned = plannedWeekdays ? plannedWeekdays.includes(weekdayOf(cursor)) : true;
    if (status === 'trained') streak++;
    else if (status === 'rest' || (status === undefined && !planned)) {
      /* neutral — keep walking back */
    } else if (!(first && status === undefined)) {
      // A missed (skipped) day or an unlogged planned day ends the streak.
      break;
    }
    first = false;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

/**
 * Unresolved PLANNED days in the recent past, oldest first (yesterday
 * backwards, never today — finishing a session closes today by itself).
 */
export const findGaps = (
  logged: ReadonlySet<string>,
  plannedWeekdays: number[] | null,
  today: string,
  daysBack = 7,
): string[] => {
  if (!plannedWeekdays?.length) return [];
  const cursor = dateFromKey(today);
  const gaps: string[] = [];
  for (let i = 0; i < daysBack; i++) {
    cursor.setDate(cursor.getDate() - 1);
    const key = localDateKey(cursor);
    if (plannedWeekdays.includes(weekdayOf(cursor)) && !logged.has(key)) gaps.push(key);
  }
  return gaps.reverse();
};
