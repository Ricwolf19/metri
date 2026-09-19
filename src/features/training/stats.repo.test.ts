import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlannedSlot } from '@/db/schema';
import { exercises, setLogs, users, workoutLogs } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { effortSummary, effortSets, monthlyWorkouts, recentWorkouts, workoutCounts, loadedSets } =
  await import('./stats.repo');

const U = 'u-1';
const EPOCH = new Date('2020-01-01');

const wipe = () => {
  for (const table of [setLogs, workoutLogs, exercises, users]) db.delete(table).run();
  db.insert(users).values({ id: U, email: null, authKind: 'local' }).run();
  db.insert(exercises)
    .values({ id: 'bench', name: 'Bench', category: 'chest', primaryMuscles: ['chest'] })
    .run();
};

const snapshot = (sets: number, rirMin: number, rirMax: number): PlannedSlot[] => [
  {
    slotId: 's1',
    exerciseId: 'bench',
    name: 'Bench',
    setGroups: [{ sets, reps: 8, rirMin, rirMax }],
    restSeconds: 120,
    badges: [],
    alternativeExerciseIds: [],
  },
];

let seq = 0;

/** A completed session with its prescription and the sets actually logged. */
const logSession = (
  completedAt: Date,
  plannedSnapshot: PlannedSlot[] | null,
  sets: { rir: number | null; isWarmup?: boolean; weightKg?: number; reps?: number }[],
  status: 'completed' | 'abandoned' = 'completed',
) => {
  const id = `log-${seq++}`;
  db.insert(workoutLogs)
    .values({
      id,
      userId: U,
      userProgramId: 'up',
      workoutDayId: 'day',
      weekNumber: 1,
      status,
      startedAt: completedAt,
      completedAt,
      plannedSnapshot,
    })
    .run();
  sets.forEach((s, i) => {
    db.insert(setLogs)
      .values({
        id: `${id}-set-${i}`,
        workoutLogId: id,
        exerciseId: 'bench',
        setNumber: i + 1,
        weightKg: s.weightKg ?? 100,
        reps: s.reps ?? 8,
        rir: s.rir,
        isWarmup: s.isWarmup ?? false,
        createdAt: completedAt,
      })
      .run();
  });
  return id;
};

describe('workoutCounts', () => {
  beforeEach(wipe);

  it('counts every completed session, and this month separately', () => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 5);
    const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), 5);
    logSession(thisMonth, null, [{ rir: 2 }]);
    logSession(lastYear, null, [{ rir: 2 }]);

    expect(workoutCounts(U)).toEqual({ total: 2, thisMonth: 1 });
  });

  it('ignores abandoned sessions', () => {
    logSession(new Date(), null, [{ rir: 2 }], 'abandoned');
    expect(workoutCounts(U).total).toBe(0);
  });
});

describe('monthlyWorkouts', () => {
  beforeEach(wipe);

  it('returns a zero-filled window, oldest → newest', () => {
    const series = monthlyWorkouts(U, 6);
    expect(series).toHaveLength(6);
    expect(series.every((m) => m.count === 0)).toBe(true);
    expect([...series].sort((a, b) => (a.month < b.month ? -1 : 1))).toEqual(series);
  });

  it('counts sessions into their own month', () => {
    const now = new Date();
    logSession(new Date(now.getFullYear(), now.getMonth(), 3), null, [{ rir: 2 }]);
    logSession(new Date(now.getFullYear(), now.getMonth(), 4), null, [{ rir: 2 }]);

    const series = monthlyWorkouts(U, 6);
    expect(series[series.length - 1].count).toBe(2);
  });

  it('drops sessions older than the window rather than folding them into month 1', () => {
    logSession(new Date(2020, 0, 1), null, [{ rir: 2 }]);
    expect(monthlyWorkouts(U, 3).every((m) => m.count === 0)).toBe(true);
  });
});

describe('recentWorkouts', () => {
  beforeEach(wipe);

  it('reports newest first with working volume and set count', () => {
    logSession(new Date('2026-09-10'), null, [{ rir: 2, weightKg: 100, reps: 5 }]);
    logSession(new Date('2026-09-18'), null, [
      { rir: 2, weightKg: 60, reps: 10 },
      { rir: 1, weightKg: 60, reps: 10 },
    ]);

    const [newest, older] = recentWorkouts(U, 5);
    expect(newest).toMatchObject({ setCount: 2, volumeKg: 1200 });
    expect(older).toMatchObject({ setCount: 1, volumeKg: 500 });
  });

  it('excludes warm-ups from volume and set count', () => {
    logSession(new Date('2026-09-18'), null, [
      { rir: null, weightKg: 40, reps: 8, isWarmup: true },
      { rir: 2, weightKg: 100, reps: 5 },
    ]);
    expect(recentWorkouts(U, 5)[0]).toMatchObject({ setCount: 1, volumeKg: 500 });
  });

  it('honours the limit', () => {
    for (let i = 1; i <= 4; i++) logSession(new Date(`2026-09-1${i}`), null, [{ rir: 2 }]);
    expect(recentWorkouts(U, 2)).toHaveLength(2);
  });
});

describe('effortSummary', () => {
  beforeEach(wipe);

  it('sums verdicts across sessions, each scored against its OWN snapshot', () => {
    // Session A prescribed RIR 1-3; both sets landed inside it.
    logSession(new Date('2026-09-18'), snapshot(2, 1, 3), [{ rir: 2 }, { rir: 1 }]);
    // Session B prescribed RIR 0-0; the set left 4 reps in reserve.
    logSession(new Date('2026-09-19'), snapshot(1, 0, 0), [{ rir: 4 }]);

    const summary = effortSummary(U, EPOCH);
    expect(summary).toMatchObject({ on_target: 2, easy: 1, hard: 0, total: 3 });
  });

  it('excludes warm-ups, which carry no prescription', () => {
    logSession(new Date('2026-09-18'), snapshot(1, 1, 3), [
      { rir: null, isWarmup: true },
      { rir: 2 },
    ]);
    expect(effortSummary(U, EPOCH).total).toBe(1);
  });

  it('scores a session with no snapshot as unknown rather than dropping it', () => {
    logSession(new Date('2026-09-18'), null, [{ rir: 2 }]);
    expect(effortSummary(U, EPOCH)).toMatchObject({ unknown: 1, on_target: 0, total: 1 });
  });

  it('is all zeros when the window holds no sessions', () => {
    logSession(new Date('2020-01-02'), snapshot(1, 1, 3), [{ rir: 2 }]);
    expect(effortSummary(U, new Date('2026-01-01')).total).toBe(0);
  });
});

describe('effortSets and loadedSets', () => {
  beforeEach(wipe);

  it('both exclude warm-ups and abandoned sessions', () => {
    logSession(new Date('2026-09-18'), null, [{ rir: null, isWarmup: true }, { rir: 2 }]);
    logSession(new Date('2026-09-18'), null, [{ rir: 0 }], 'abandoned');

    expect(effortSets(U, EPOCH)).toHaveLength(1);
    expect(loadedSets(U, EPOCH)).toHaveLength(1);
  });

  it('loadedSets carries the fields the muscle models need', () => {
    logSession(new Date('2026-09-18'), null, [{ rir: 1, weightKg: 90, reps: 6 }]);
    expect(loadedSets(U, EPOCH)[0]).toMatchObject({
      exerciseId: 'bench',
      weightKg: 90,
      reps: 6,
      rir: 1,
      isFailure: false,
    });
    expect(typeof loadedSets(U, EPOCH)[0].at).toBe('number');
  });
});
