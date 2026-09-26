import { dateFromKey, weekdayOf } from './dates';
import { findGaps } from './streak';

/**
 * Which days the catch-up flow asks about, in order. Pure so the ordering
 * rules (today leads once its check-in window passed; older planned misses
 * follow oldest-first; a day already logged is never re-asked) are testable
 * without the banner component.
 */

export type CatchupInput = {
  /** Dates with a training-day entry (any status). */
  logged: ReadonlySet<string>;
  /** Planned weekdays (expo-numbered) of the enrolled program, null without one. */
  plannedWeekdays: number[] | null;
  /** 'YYYY-MM-DD'. */
  today: string;
  /** Raw session times the check-in rides on (one per scheduled split). */
  checkinSchedule: { weekday: number; hour: number; minute: number }[];
  offsetMinutes: number;
  /** Minutes since local midnight right now. */
  nowMinutes: number;
  /** How far back unresolved planned days stay askable. */
  daysBack?: number;
};

/** A month back: far enough to close a holiday, near enough that answering stays honest. */
export const CATCHUP_DAYS_BACK = 30;

const weekdayOfKey = (key: string): number => weekdayOf(dateFromKey(key));

export const selectCatchupGaps = ({
  logged,
  plannedWeekdays,
  today,
  checkinSchedule,
  offsetMinutes,
  nowMinutes,
  daysBack = CATCHUP_DAYS_BACK,
}: CatchupInput): string[] => {
  const past = findGaps(logged, plannedWeekdays, today, daysBack);
  // Today leads when its session has been and gone: it is what the check-in
  // notification just asked about, and the backlog can wait one more tap.
  // A logged day (e.g. today's workout just finished) is never re-asked —
  // training the day after a missed planned day surfaces that miss, not today.
  const todayWeekday = weekdayOfKey(today);
  const dueToday =
    !logged.has(today) &&
    checkinSchedule.some(
      (entry) =>
        entry.weekday === todayWeekday &&
        entry.hour * 60 + entry.minute + offsetMinutes <= nowMinutes,
    );
  return dueToday ? [today, ...past] : past;
};
