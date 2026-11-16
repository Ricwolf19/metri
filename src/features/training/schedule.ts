import type { Routine, WorkoutDay } from '@/db/schema';
import type { ClockFormat } from '@/lib/storage';

import { dateFromKey } from './dates';

/** Pure schedule logic (no DB). Weekday + start minute live on the enrolled copy only — AGENTS.md#conventions. */

/** A split's planned weekday. The plan holds DAYS only: when in the day is the
 * lifter's call (and the reminder's own setting), never part of the program. */
export type ScheduleEntry = { dayId: string; weekday: number };

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
  !!e && Number.isInteger(e.weekday) && e.weekday >= 1 && e.weekday <= 7;

/** How many splits a week the phases ask for, ascending: the start flow asks for
 * one set of training days per count, not a day for every split of every phase. */
export const splitCounts = (tree: ProgramTree): number[] =>
  [...new Set(tree.routines.map((r) => r.days.length).filter((n) => n > 0))].sort((a, b) => a - b);

/** A pick is complete with one distinct weekday per split — a week holds at most seven. */
export const isPickComplete = (count: number, picked: readonly number[]): boolean =>
  new Set(picked).size === Math.min(count, 7);

/** Monday-first position of an expo weekday (Mon = 0 … Sun = 6). */
const mondayFirst = (weekday: number): number => (weekday + 5) % 7;

/**
 * Every split of every phase scheduled from ONE pick of training days per
 * splits-a-week count: a phase's splits, in order, take the picked days in week
 * order (Monday first), so every 3-day phase trains the same three days. A
 * count without a pick leaves its splits out (`isScheduleComplete` then fails).
 */
export const scheduleFromPicks = (
  tree: ProgramTree,
  picks: Readonly<Record<number, readonly number[]>>,
): ScheduleEntry[] =>
  tree.routines.flatMap((routine) => {
    const weekdays = [...new Set(picks[routine.days.length] ?? [])].sort(
      (a, b) => mondayFirst(a) - mondayFirst(b),
    );
    if (!weekdays.length) return [];
    return [...routine.days]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((day, i) => ({ dayId: day.id, weekday: weekdays[i % weekdays.length] }));
  });

/** Every split of every phase has a valid weekday. */
export const isScheduleComplete = (tree: ProgramTree, entries: ScheduleEntry[]): boolean => {
  const byDay = new Map(entries.map((e) => [e.dayId, e]));
  return tree.routines.every((r) => r.days.every((d) => isValidEntry(byDay.get(d.id))));
};

/** Distinct scheduled weekdays, ascending; unscheduled splits are skipped. */
export const deriveTrainingWeekdays = (days: readonly ScheduledDay[]): number[] =>
  [...new Set(days.flatMap((d) => (d.weekday == null ? [] : [d.weekday])))].sort((a, b) => a - b);

/** Expo weekday of a date. */
export const weekdayOfDate = (date: Date): number => date.getDay() + 1;

/**
 * The split to train next: the first in split order without a session this
 * week. Splits unlock in order whatever the weekday says — a split whose day
 * passed untrained is simply still next, carried over to the next session —
 * so the plan is always finished, never left with a hole. Null once every
 * split is resolved (the cursor then moves on).
 */
export const nextPendingSplit = <T extends ScheduledDay>(
  days: readonly T[],
  resolved: ReadonlySet<string>,
): T | null =>
  [...days].sort((a, b) => a.orderIndex - b.orderIndex).find((d) => !resolved.has(d.id)) ?? null;

/**
 * The one split planned on a calendar day ('YYYY-MM-DD'), or null when none is
 * or several are (two splits on one weekday: the caller must pick explicitly).
 */
export const plannedSplitForDate = <T extends ScheduledDay>(
  days: readonly T[],
  dateKey: string,
): T | null => {
  const weekday = weekdayOfDate(dateFromKey(dateKey));
  const matches = days.filter((d) => d.weekday === weekday);
  return matches.length === 1 ? matches[0] : null;
};

export type ReminderEntry = { weekday: number; hour: number; minute: number };

/**
 * One reminder per training weekday, all at `atMinute` — the training-time
 * reminder's own setting, since the plan holds days only. Sorted by weekday.
 */
export const reminderEntries = (days: readonly ScheduledDay[], atMinute: number): ReminderEntry[] =>
  deriveTrainingWeekdays(days).map((weekday) => ({ weekday, ...toHourMinute(atMinute) }));

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
