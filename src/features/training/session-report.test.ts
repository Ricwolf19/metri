import { describe, expect, it } from 'vitest';

import type { PlannedSlot, SetLog } from '@/db/schema';

import {
  buildSessionReport,
  COMPARABLE_SECONDS,
  durationText,
  missedSetsOf,
  pickTopExercise,
  plannedSetCount,
  topSetOf,
  type TopCandidate,
} from './session-report';

const T = new Date(2026, 10, 24, 18, 0).getTime();
const MIN = 60_000;

let seq = 0;
const set = (
  exerciseId: string,
  weightKg: number,
  reps: number,
  atMin: number,
  over: Partial<SetLog> = {},
) =>
  ({
    id: `s${++seq}`,
    workoutLogId: 'l1',
    exerciseId,
    setNumber: 1,
    weightKg,
    reps,
    rpe: null,
    rir: null,
    isWarmup: false,
    isFailure: false,
    notes: null,
    restBeforeSeconds: null,
    load: null,
    createdAt: new Date(T + atMin * MIN),
    updatedAt: null,
    ...over,
  }) satisfies SetLog;

const slot = (exerciseId: string, sets: number, over: Partial<PlannedSlot> = {}): PlannedSlot => ({
  slotId: `slot-${exerciseId}`,
  exerciseId,
  name: exerciseId,
  setGroups: [{ sets, reps: 8 }],
  restSeconds: 120,
  badges: [],
  alternativeExerciseIds: [],
  ...over,
});

const candidate = (over: Partial<TopCandidate> & { exerciseId: string }): TopCandidate => ({
  name: over.exerciseId,
  topKg: 100,
  topReps: 5,
  isPr: false,
  volumeKg: 1000,
  setCount: 3,
  e1rmKg: null,
  previousE1rmKg: null,
  ...over,
});

describe('topSetOf', () => {
  it('is the heaviest set, a tie going to more reps', () => {
    expect(
      topSetOf([set('b', 100, 5, 1), set('b', 102.5, 3, 2), set('b', 102.5, 4, 3)]),
    ).toMatchObject({ weightKg: 102.5, reps: 4 });
    expect(topSetOf([])).toBeNull();
  });
});

describe('pickTopExercise', () => {
  it('is the biggest estimated 1RM gain against last time on this split', () => {
    const top = pickTopExercise([
      candidate({ exerciseId: 'bench', e1rmKg: 105, previousE1rmKg: 100 }),
      candidate({ exerciseId: 'squat', e1rmKg: 150, previousE1rmKg: 140, isPr: true }),
      candidate({ exerciseId: 'row', volumeKg: 9000 }),
    ]);
    expect(top).toMatchObject({ exerciseId: 'squat', reason: 'progress' });
    expect(top?.gain).toBeCloseTo(150 / 140 - 1);
  });

  it('with no gain anywhere, the heaviest record of the session, by estimated 1RM', () => {
    const top = pickTopExercise([
      candidate({ exerciseId: 'bench', e1rmKg: 100, previousE1rmKg: 100 }),
      candidate({ exerciseId: 'curl', isPr: true, e1rmKg: 40 }),
      candidate({ exerciseId: 'deadlift', isPr: true, e1rmKg: 180 }),
    ]);
    expect(top).toMatchObject({ exerciseId: 'deadlift', reason: 'record', gain: null });
  });

  it('with neither, the most volume (a tie going to more sets)', () => {
    expect(
      pickTopExercise([
        candidate({ exerciseId: 'a', volumeKg: 2000, setCount: 3 }),
        candidate({ exerciseId: 'b', volumeKg: 2000, setCount: 4 }),
        candidate({ exerciseId: 'c', volumeKg: 1500, setCount: 5 }),
      ]),
    ).toMatchObject({ exerciseId: 'b', reason: 'volume' });
  });

  it('a lighter session than last time is no "progress": it falls through to volume', () => {
    expect(
      pickTopExercise([candidate({ exerciseId: 'bench', e1rmKg: 95, previousE1rmKg: 100 })]),
    ).toMatchObject({ reason: 'volume' });
  });

  it('is null with nothing logged', () => {
    expect(pickTopExercise([])).toBeNull();
  });
});

describe('missedSetsOf and plannedSetCount', () => {
  it('counts skipped rows, or what was left of a skipped exercise', () => {
    expect(missedSetsOf(slot('bench', 4, { skippedSets: [2, 3] }), 2)).toBe(2);
    expect(missedSetsOf(slot('bench', 4, { skipped: { at: 1 } }), 2)).toBe(2);
    expect(missedSetsOf(slot('bench', 4, { skipped: { at: 1 } }), 0)).toBe(4);
    expect(missedSetsOf(slot('bench', 4), 4)).toBe(0);
  });

  it('the plan is the planned exercises: one added today is not part of it', () => {
    expect(plannedSetCount([slot('a', 4), slot('b', 3), slot('c', 1, { added: { at: 1 } })])).toBe(
      7,
    );
  });
});

describe('durationText', () => {
  it('reads minutes, then hours and minutes', () => {
    expect(durationText(20)).toBe('0m');
    expect(durationText(45 * 60)).toBe('45m');
    expect(durationText(65 * 60)).toBe('1h 05m');
  });
});

describe('buildSessionReport', () => {
  const nameOf = (id: string, fallback?: string) => fallback ?? id.toUpperCase();
  const log = {
    startedAt: new Date(T),
    durationSeconds: 40 * 60,
    completedAt: new Date(T + 40 * MIN),
    plannedSnapshot: [
      slot('bench', 3),
      slot('fly', 3, { skipped: { at: 1 }, name: 'Cable fly' }),
      slot('row', 3, { skippedSets: [2] }),
    ],
  };
  const sets = [
    set('bench', 100, 5, 8),
    set('bench', 100, 5, 11, { restBeforeSeconds: 130 }),
    set('bench', 100, 4, 14, { restBeforeSeconds: 125 }),
    set('row', 80, 8, 20, { restBeforeSeconds: 200 }),
    set('row', 80, 8, 23, { restBeforeSeconds: 120 }),
  ];

  it('lists each exercise with its sets in logging order, then the ones missed outright', () => {
    const report = buildSessionReport({
      log,
      sets,
      nameOf,
      prIds: new Set(['row']),
      previous: null,
      defaultRestSeconds: 120,
    });
    expect(report.exercises.map((e) => [e.exerciseId, e.sets.length, e.missed, e.isPr])).toEqual([
      ['bench', 3, 0, false],
      ['row', 2, 1, true],
      ['fly', 0, 3, false],
    ]);
    // A missed exercise keeps its plan name when the catalog has none to give.
    expect(report.exercises[2].name).toBe('Cable fly');
    expect(report.setsDone).toBe(5);
    expect(report.setsPlanned).toBe(9);
    expect(report.missedSets).toBe(4);
    expect(report.volumeKg).toBe(100 * 5 * 2 + 100 * 4 + 80 * 8 * 2);
    expect(report.vsLast).toBeNull();
  });

  it('compares with the previous run of the split: totals and each top set', () => {
    const previous = {
      log: {
        id: 'l0',
        weekNumber: 1,
        completedAt: new Date(T - 7 * 24 * 60 * MIN),
        durationSeconds: 45 * 60,
      },
      sets: [set('bench', 95, 5, -10000), set('bench', 95, 5, -9997), set('row', 80, 8, -9990)],
    };
    const report = buildSessionReport({
      log,
      sets,
      nameOf,
      prIds: new Set(),
      previous,
      defaultRestSeconds: 120,
    });
    expect(report.vsLast).toMatchObject({
      logId: 'l0',
      weekNumber: 1,
      volumeDeltaKg: 2680 - (95 * 5 * 2 + 80 * 8),
      setsDelta: 2,
      durationDeltaSeconds: -5 * 60,
    });
    const bench = report.exercises.find((e) => e.exerciseId === 'bench')!;
    expect(bench.vsLast).toMatchObject({ weightKg: 95, reps: 5 });
    expect(bench.vsLast?.e1rmGain).toBeCloseTo((100 * (1 + 5 / 30)) / (95 * (1 + 5 / 30)) - 1);
    // Not trained last time: nothing to compare it with.
    expect(report.exercises.find((e) => e.exerciseId === 'fly')?.vsLast).toBeNull();
  });

  it('leaves the length out of the comparison when last time was a session left open', () => {
    const report = buildSessionReport({
      log,
      sets,
      nameOf,
      prIds: new Set(),
      previous: {
        log: {
          id: 'l0',
          weekNumber: 1,
          completedAt: null,
          durationSeconds: COMPARABLE_SECONDS + 1,
        },
        sets: [set('bench', 95, 5, -10000)],
      },
      defaultRestSeconds: 120,
    });
    expect(report.vsLast?.durationDeltaSeconds).toBeNull();
  });

  it('times the session from its start to the end it was filed with, using the recorded rests', () => {
    const report = buildSessionReport({
      log,
      sets,
      nameOf,
      prIds: new Set(),
      previous: null,
      defaultRestSeconds: 120,
    });
    expect(report.timing).toMatchObject({ totalSeconds: 40 * 60, leadInSeconds: 8 * 60 });
    expect(report.timing?.rest).toMatchObject({
      measured: 4,
      takenSeconds: Math.round((130 + 125 + 200 + 120) / 4),
    });
  });

  it('has no timing with nothing logged', () => {
    expect(
      buildSessionReport({
        log,
        sets: [],
        nameOf,
        prIds: new Set(),
        previous: null,
        defaultRestSeconds: 120,
      }).timing,
    ).toBeNull();
  });
});
