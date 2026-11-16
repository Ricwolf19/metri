import { describe, expect, it } from 'vitest';

import {
  deriveTrainingWeekdays,
  formatClockTime,
  isPickComplete,
  isScheduleComplete,
  nextPendingSplit,
  plannedSplitForDate,
  reminderEntries,
  scheduleFromPicks,
  splitCounts,
  suggestWeekdays,
  validateProgramForStart,
  type ProgramTree,
  type ScheduledDay,
  type TreeDay,
  type TreeRoutine,
} from './schedule';

// Minimal row factories — the functions under test only read the listed fields.
const day = (id: string, routineId: string, slotCount: number, orderIndex = 0): TreeDay =>
  ({ id, routineId, name: id, orderIndex, slotCount }) as TreeDay;
const routine = (id: string, days: TreeDay[]): TreeRoutine =>
  ({ id, name: id, orderIndex: 0, days }) as TreeRoutine;
const tree = (routines: TreeRoutine[]): ProgramTree => ({ routines });

const scheduled = (
  id: string,
  weekday: number | null,
  startMinute: number | null,
): ScheduledDay => ({
  id,
  routineId: 'r1',
  name: id,
  orderIndex: 0,
  weekday,
  startMinute,
});

describe('validateProgramForStart', () => {
  it.each<[string, ProgramTree, string[]]>([
    ['no phases', tree([]), ['no_phases']],
    ['phase without splits', tree([routine('r1', [])]), ['phase_no_splits']],
    [
      'split without exercises',
      tree([routine('r1', [day('d1', 'r1', 0)])]),
      ['split_no_exercises'],
    ],
    ['valid tree', tree([routine('r1', [day('d1', 'r1', 3)])]), []],
    [
      'multiple problems in order',
      tree([routine('r1', [day('d1', 'r1', 0), day('d2', 'r1', 2)]), routine('r2', [])]),
      ['split_no_exercises', 'phase_no_splits'],
    ],
  ])('%s', (_, input, kinds) => {
    expect(validateProgramForStart(input).map((p) => p.kind)).toEqual(kinds);
  });

  it('names the offending phase and split', () => {
    const [problem] = validateProgramForStart(tree([routine('base', [day('push', 'base', 0)])]));
    expect(problem).toEqual({
      kind: 'split_no_exercises',
      routineId: 'base',
      routineName: 'base',
      routineOrder: 0,
      dayId: 'push',
      dayName: 'push',
      dayOrder: 0,
    });
  });
});

describe('scheduleFromPicks + isScheduleComplete', () => {
  // Phase 1 and 3 train three splits a week, phase 2 four.
  const program = tree([
    routine('r1', [day('a1', 'r1', 1, 0), day('a2', 'r1', 1, 1), day('a3', 'r1', 1, 2)]),
    routine('r2', [
      day('b1', 'r2', 1, 0),
      day('b2', 'r2', 1, 1),
      day('b3', 'r2', 1, 2),
      day('b4', 'r2', 1, 3),
    ]),
    // Out of order on purpose: the split ORDER, not the row order, takes the days.
    routine('r3', [day('c2', 'r3', 1, 1), day('c1', 'r3', 1, 0), day('c3', 'r3', 1, 2)]),
  ]);

  it('asks once per splits-a-week count', () => {
    expect(splitCounts(program)).toEqual([3, 4]);
  });

  it('gives every phase with that count the same days, in week order', () => {
    // Picked Friday first and Sunday among them: the week still runs Monday → Sunday.
    const entries = scheduleFromPicks(program, { 3: [6, 2, 1], 4: [2, 3, 5, 6] });
    const at = (id: string) => entries.find((e) => e.dayId === id)?.weekday;
    expect([at('a1'), at('a2'), at('a3')]).toEqual([2, 6, 1]);
    expect([at('c1'), at('c2'), at('c3')]).toEqual([2, 6, 1]);
    expect([at('b1'), at('b2'), at('b3'), at('b4')]).toEqual([2, 3, 5, 6]);
    expect(isScheduleComplete(program, entries)).toBe(true);
  });

  it('leaves a count without a pick unscheduled, so the start stays blocked', () => {
    const entries = scheduleFromPicks(program, { 3: [2, 4, 6] });
    expect(entries.some((e) => e.dayId.startsWith('b'))).toBe(false);
    expect(isScheduleComplete(program, entries)).toBe(false);
  });

  it('wants one distinct day per split, at most seven', () => {
    expect(isPickComplete(3, [2, 4, 6])).toBe(true);
    expect(isPickComplete(3, [2, 4])).toBe(false);
    expect(isPickComplete(3, [2, 2, 4])).toBe(false);
    expect(isPickComplete(9, [1, 2, 3, 4, 5, 6, 7])).toBe(true);
  });

  it('rejects an out-of-range weekday', () => {
    const one = tree([routine('r1', [day('a1', 'r1', 1)])]);
    expect(isScheduleComplete(one, [{ dayId: 'a1', weekday: 8 }])).toBe(false);
    expect(isScheduleComplete(one, [{ dayId: 'a1', weekday: 7 }])).toBe(true);
  });
});

describe('deriveTrainingWeekdays', () => {
  const days = [
    scheduled('pm', 4, 1080),
    scheduled('am', 4, 420),
    scheduled('legs', 6, 1080),
    scheduled('unscheduled', null, null),
  ];

  it('dedupes same-weekday splits, sorts, skips unscheduled', () => {
    expect(deriveTrainingWeekdays(days)).toEqual([4, 6]);
  });
});

describe('reminderEntries', () => {
  it('one per training weekday at the reminder time, whatever a split stored', () => {
    expect(
      reminderEntries(
        [scheduled('b', 6, 1080), scheduled('a', 2, 600), scheduled('a2', 2, null)],
        18 * 60 + 30,
      ),
    ).toEqual([
      { weekday: 2, hour: 18, minute: 30 },
      { weekday: 6, hour: 18, minute: 30 },
    ]);
    expect(reminderEntries([scheduled('x', null, null)], 600)).toEqual([]);
  });
});

describe('formatClockTime', () => {
  it.each<[number, string, string]>([
    [0, '00:00', '12:00 AM'],
    [750, '12:30', '12:30 PM'],
    [1110, '18:30', '6:30 PM'],
  ])('%i', (minute, h24, h12) => {
    expect(formatClockTime(minute, '24')).toBe(h24);
    expect(formatClockTime(minute, '12')).toBe(h12);
  });
});

describe('suggestWeekdays', () => {
  // The rule the patterns encode: no three training days in a row until the
  // week is too full for that to be possible.
  const runs = (days: number[]): number => {
    const week = [2, 3, 4, 5, 6, 7, 1]; // Monday-first
    const on = week.map((d) => days.includes(d));
    let longest = 0;
    let current = 0;
    for (const trains of on) {
      current = trains ? current + 1 : 0;
      longest = Math.max(longest, current);
    }
    return longest;
  };

  it.each([1, 2, 3, 4, 5])('keeps %s training days at most two in a row', (count) => {
    const days = suggestWeekdays(count);
    expect(days).toHaveLength(count);
    expect(new Set(days).size).toBe(count);
    expect(runs(days)).toBeLessThanOrEqual(2);
  });

  it('clamps beyond a week instead of returning nothing', () => {
    expect(suggestWeekdays(9)).toHaveLength(7);
    expect(suggestWeekdays(0)).toEqual(suggestWeekdays(1));
  });
});

describe('plannedSplitForDate', () => {
  // 2026-09-14 is a Monday (expo weekday 2), 2026-09-16 a Wednesday (4).
  const days = [scheduled('push', 2, 600), scheduled('pull', 5, 600), scheduled('legs', 2, 1080)];

  it('maps a day onto the one split planned for its weekday', () => {
    expect(plannedSplitForDate([days[0], days[1]], '2026-09-14')?.id).toBe('push');
  });

  it('is null when nothing is planned that weekday, or when two splits share it', () => {
    expect(plannedSplitForDate(days, '2026-09-16')).toBeNull();
    expect(plannedSplitForDate(days, '2026-09-14')).toBeNull();
  });
});

describe('nextPendingSplit', () => {
  // Declared out of order and on weekdays that do not match the order: only
  // `orderIndex` and the resolved set may decide.
  const week = [
    { ...scheduled('pull', 5, 600), orderIndex: 1 },
    { ...scheduled('legs', 2, 600), orderIndex: 2 },
    { ...scheduled('push', 7, 600), orderIndex: 0 },
  ];

  it('is the first split in order with no session this week, whatever the weekday', () => {
    expect(nextPendingSplit(week, new Set())?.id).toBe('push');
    expect(nextPendingSplit(week, new Set(['push']))?.id).toBe('pull');
  });

  it('skips every resolved split, and is null once the week is complete', () => {
    expect(nextPendingSplit(week, new Set(['push', 'pull']))?.id).toBe('legs');
    expect(nextPendingSplit(week, new Set(['push', 'pull', 'legs']))).toBeNull();
  });
});
