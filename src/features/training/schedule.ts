import type { Routine, WorkoutDay } from '@/db/schema';
import type { ClockFormat } from '@/lib/storage';

/** Pure schedule logic (no DB). Weekday + start minute live on the enrolled copy only — AGENTS.md#conventions. */

export type ScheduleEntry = { dayId: string; weekday: number; startMinute: number };

export type ScheduledDay = Pick<
  WorkoutDay,
  'id' | 'routineId' | 'name' | 'orderIndex' | 'weekday' | 'startMinute'
>;

export type TreeDay = WorkoutDay & { slotCount: number };
export type TreeRoutine = Routine & { days: TreeDay[] };
export type ProgramTree = { routines: TreeRoutine[] };

export type StartProblem =
  | { kind: 'no_phases' }
  | { kind: 'phase_no_splits'; routineId: string; routineName: string; routineOrder: number }
  | {
      kind: 'split_no_exercises';
      routineId: string;
      routineName: string;
      routineOrder: number;
      dayId: string;
      dayName: string;
      dayOrder: number;
    };

const MINUTES_PER_DAY = 1440;
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY;

/** Structural problems that make a program unstartable, in tree order. */
export const validateProgramForStart = (tree: ProgramTree): StartProblem[] => {
  if (tree.routines.length === 0) return [{ kind: 'no_phases' }];
  const problems: StartProblem[] = [];
  for (const routine of tree.routines) {
    if (routine.days.length === 0) {
      problems.push({
        kind: 'phase_no_splits',
        routineId: routine.id,
        routineName: routine.name,
        routineOrder: routine.orderIndex,
      });
      continue;
    }
    for (const day of routine.days) {
      if (day.slotCount === 0) {
        problems.push({
          kind: 'split_no_exercises',
          routineId: routine.id,
          routineName: routine.name,
          routineOrder: routine.orderIndex,
          dayId: day.id,
          dayName: day.name,
          dayOrder: day.orderIndex,
        });
      }
    }
  }
  return problems;
};

/**
 * Conventional weekday patterns per training-day count (expo numbering, Monday
 * first). Table, not an algorithm: these are the splits people actually run.
 *
 * Each keeps at most two training days back to back reading Monday→Sunday.
 * Past five days a week that is only true within the week — six or seven days
 * cannot avoid a longer streak across the Sunday/Monday boundary.
 */
const SUGGESTED_WEEKDAYS: Record<number, number[]> = {
  1: [2],
  2: [2, 5],
  3: [2, 4, 6],
  4: [2, 3, 5, 6],
  5: [2, 3, 5, 6, 1],
  6: [2, 3, 4, 6, 7, 1],
  7: [2, 3, 4, 5, 6, 7, 1],
};

/** The pattern for `count` splits, clamped to what a week can hold. */
export const suggestWeekdays = (count: number): number[] =>
  SUGGESTED_WEEKDAYS[Math.min(Math.max(count, 1), 7)] ?? [];

const isValidEntry = (e: ScheduleEntry | undefined): e is ScheduleEntry =>
  !!e &&
  Number.isInteger(e.weekday) &&
  e.weekday >= 1 &&
  e.weekday <= 7 &&
  Number.isInteger(e.startMinute) &&
  e.startMinute >= 0 &&
  e.startMinute < MINUTES_PER_DAY;

/**
 * Mirror phase 1's schedule onto later phases by split position, for every
 * split the user has not touched. Phase-1 entries are never rewritten.
 */
export const prefillSchedule = (
  tree: ProgramTree,
  entries: ScheduleEntry[],
  touched: ReadonlySet<string> = new Set(),
): ScheduleEntry[] => {
  const [first, ...rest] = tree.routines;
  if (!first) return entries;
  const byDay = new Map(entries.map((e) => [e.dayId, e]));
  const template = first.days.map((d) => byDay.get(d.id));
  for (const routine of rest) {
    routine.days.forEach((day, i) => {
      if (touched.has(day.id)) return;
      const source = template[i];
      if (!isValidEntry(source)) return;
      byDay.set(day.id, {
        dayId: day.id,
        weekday: source.weekday,
        startMinute: source.startMinute,
      });
    });
  }
  return [...byDay.values()];
};

/** Every split of every phase has a valid weekday + time. */
export const isScheduleComplete = (tree: ProgramTree, entries: ScheduleEntry[]): boolean => {
  const byDay = new Map(entries.map((e) => [e.dayId, e]));
  return tree.routines.every((r) => r.days.every((d) => isValidEntry(byDay.get(d.id))));
};

/** Distinct scheduled weekdays, ascending; unscheduled splits are skipped. */
export const deriveTrainingWeekdays = (days: readonly ScheduledDay[]): number[] =>
  [...new Set(days.flatMap((d) => (d.weekday == null ? [] : [d.weekday])))].sort((a, b) => a - b);

/** Splits scheduled on a weekday, earliest first (AM before PM). */
export const splitsForWeekday = (days: readonly ScheduledDay[], weekday: number): ScheduledDay[] =>
  days
    .filter((d) => d.weekday === weekday)
    .sort((a, b) => (a.startMinute ?? 0) - (b.startMinute ?? 0));

/** Expo weekday of a date. */
export const weekdayOfDate = (date: Date): number => date.getDay() + 1;

/**
 * The next upcoming split relative to `now`, wrapping around the week. A split
 * scheduled exactly now counts as next. Null when nothing is scheduled.
 */
export const nextScheduledSplit = (
  days: readonly ScheduledDay[],
  now: Date,
): { day: ScheduledDay; minutesUntil: number } | null => {
  const nowMinute = now.getHours() * 60 + now.getMinutes();
  const nowWeekday = weekdayOfDate(now);
  let best: { day: ScheduledDay; minutesUntil: number } | null = null;
  for (const day of days) {
    if (day.weekday == null || day.startMinute == null) continue;
    let delta =
      ((day.weekday - nowWeekday + 7) % 7) * MINUTES_PER_DAY + (day.startMinute - nowMinute);
    if (delta < 0) delta += MINUTES_PER_WEEK;
    if (!best || delta < best.minutesUntil) best = { day, minutesUntil: delta };
  }
  return best;
};

export type ReminderEntry = { weekday: number; hour: number; minute: number };

/** Distinct (weekday, time) tuples for reminders, sorted by weekday then time. */
export const reminderEntries = (days: readonly ScheduledDay[]): ReminderEntry[] => {
  const seen = new Set<string>();
  const out: ReminderEntry[] = [];
  for (const day of days) {
    if (day.weekday == null || day.startMinute == null) continue;
    const key = `${day.weekday}:${day.startMinute}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ weekday: day.weekday, ...toHourMinute(day.startMinute) });
  }
  return out.sort((a, b) => a.weekday - b.weekday || a.hour - b.hour || a.minute - b.minute);
};

export const toHourMinute = (startMinute: number): { hour: number; minute: number } => ({
  hour: Math.floor(startMinute / 60),
  minute: startMinute % 60,
});

export const fromHourMinute = (hour: number, minute: number): number => hour * 60 + minute;

const pad2 = (n: number) => String(n).padStart(2, '0');

/** `18:30` (24h) or `6:30 PM` (12h). */
export const formatClockTime = (startMinute: number, clock: ClockFormat): string => {
  const { hour, minute } = toHourMinute(startMinute);
  if (clock === '12') {
    const h12 = hour % 12 || 12;
    return `${h12}:${pad2(minute)} ${hour < 12 ? 'AM' : 'PM'}`;
  }
  return `${pad2(hour)}:${pad2(minute)}`;
};
