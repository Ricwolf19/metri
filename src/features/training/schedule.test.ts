import { describe, expect, it } from 'vitest';

import {
  deriveTrainingWeekdays,
  formatClockTime,
  isScheduleComplete,
  nextScheduledSplit,
  prefillSchedule,
  reminderEntries,
  splitsForWeekday,
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

// 2026-09-16 is a Wednesday (expo weekday 4), matching streak.test.ts.
const WED_18_00 = new Date(2026, 8, 16, 18, 0);

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

describe('prefillSchedule + isScheduleComplete', () => {
  const twoPhases = tree([
    routine('r1', [day('a1', 'r1', 1, 0), day('a2', 'r1', 1, 1), day('a3', 'r1', 1, 2)]),
    routine('r2', [day('b1', 'r2', 1, 0), day('b2', 'r2', 1, 1), day('b3', 'r2', 1, 2)]),
  ]);
  const phaseOne = [
    { dayId: 'a1', weekday: 2, startMinute: 1080 },
    { dayId: 'a2', weekday: 4, startMinute: 1080 },
    { dayId: 'a3', weekday: 6, startMinute: 1080 },
  ];

  it('mirrors phase 1 onto phase 2 by split position', () => {
    const filled = prefillSchedule(twoPhases, phaseOne);
    expect(filled.find((e) => e.dayId === 'b2')).toEqual({
      dayId: 'b2',
      weekday: 4,
      startMinute: 1080,
    });
    expect(isScheduleComplete(twoPhases, filled)).toBe(true);
  });

  it('leaves touched splits and extra splits alone', () => {
    const longer = tree([
      twoPhases.routines[0],
      routine('r2', [...twoPhases.routines[1].days, day('b4', 'r2', 1, 3)]),
    ]);
    const custom = { dayId: 'b1', weekday: 1, startMinute: 600 };
    const filled = prefillSchedule(longer, [...phaseOne, custom], new Set(['b1']));
    expect(filled.find((e) => e.dayId === 'b1')).toEqual(custom);
    expect(filled.find((e) => e.dayId === 'b4')).toBeUndefined();
    expect(isScheduleComplete(longer, filled)).toBe(false);
  });

  it('rejects out-of-range values', () => {
    const one = tree([routine('r1', [day('a1', 'r1', 1)])]);
    expect(isScheduleComplete(one, [{ dayId: 'a1', weekday: 8, startMinute: 0 }])).toBe(false);
    expect(isScheduleComplete(one, [{ dayId: 'a1', weekday: 1, startMinute: 1440 }])).toBe(false);
    expect(isScheduleComplete(one, [{ dayId: 'a1', weekday: 7, startMinute: 1439 }])).toBe(true);
  });
});

describe('deriveTrainingWeekdays / splitsForWeekday', () => {
  const days = [
    scheduled('pm', 4, 1080),
    scheduled('am', 4, 420),
    scheduled('legs', 6, 1080),
    scheduled('unscheduled', null, null),
  ];

  it('dedupes same-weekday splits, sorts, skips unscheduled', () => {
    expect(deriveTrainingWeekdays(days)).toEqual([4, 6]);
  });

  it('orders a weekday AM before PM and returns empty when none', () => {
    expect(splitsForWeekday(days, 4).map((d) => d.id)).toEqual(['am', 'pm']);
    expect(splitsForWeekday(days, 1)).toEqual([]);
  });
});

describe('nextScheduledSplit', () => {
  it.each<[string, ScheduledDay[], string | null, number]>([
    ['later today', [scheduled('pm', 4, 1140), scheduled('sat', 7, 600)], 'pm', 60],
    [
      'tomorrow when today is past',
      [scheduled('early', 4, 600), scheduled('thu', 5, 600)],
      'thu',
      960,
    ],
    ['wraps the week', [scheduled('mon', 2, 1080)], 'mon', 5 * 1440],
    ['exactly now counts', [scheduled('now', 4, 1080)], 'now', 0],
    ['nothing scheduled', [scheduled('x', null, null)], null, 0],
  ])('%s', (_, days, expectedId, minutes) => {
    const next = nextScheduledSplit(days, WED_18_00);
    expect(next?.day.id ?? null).toBe(expectedId);
    if (expectedId) expect(next?.minutesUntil).toBe(minutes);
  });
});

describe('reminderEntries', () => {
  it('dedupes identical tuples across splits and sorts', () => {
    expect(
      reminderEntries([scheduled('b', 6, 1080), scheduled('a', 2, 1110), scheduled('a2', 2, 1110)]),
    ).toEqual([
      { weekday: 2, hour: 18, minute: 30 },
      { weekday: 6, hour: 18, minute: 0 },
    ]);
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
