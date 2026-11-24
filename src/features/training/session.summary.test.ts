import { beforeEach, describe, expect, it, vi } from 'vitest';

import { eq } from 'drizzle-orm';

import { exercises, setLogs, users, workoutDays, workoutLogs, type PlannedSlot } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { fromKgHalf } = await import('./progression');
const { getWorkout, previousSplitSession, sessionSummary } = await import('./session.repo');
const { sessionReport } = await import('./session-report.repo');

const log = (id: string, status: 'completed' | 'in_progress') =>
  db
    .insert(workoutLogs)
    .values({
      id,
      userId: 'u1',
      userProgramId: 'up1',
      workoutDayId: 'day-a',
      weekNumber: 1,
      status,
    })
    .run();
const set = (
  id: string,
  logId: string,
  exerciseId: string,
  weightKg: number,
  reps: number,
  at: number,
) =>
  db
    .insert(setLogs)
    .values({
      id,
      workoutLogId: logId,
      exerciseId,
      setNumber: 1,
      weightKg,
      reps,
      createdAt: new Date(at),
    })
    .run();

describe('sessionSummary exercises', () => {
  beforeEach(() => {
    db.delete(setLogs).run();
    db.delete(workoutLogs).run();
    db.delete(exercises).run();
    db.delete(users).run();
    db.insert(users).values({ id: 'u1', email: null, authKind: 'local' }).run();
    db.insert(exercises)
      .values([
        { id: 'barbell-bench-press', name: 'Bench Press', category: 'chest', primaryMuscles: [] },
        { id: 'u1-row', name: 'Pendlay Row', category: 'back', primaryMuscles: [] },
      ])
      .run();
  });

  it('keeps the volume whole in a lb gym: 100 lb × 20 reads 2000 lb, not 1999.5', () => {
    // Rounded to whole kg first (907 kg), the lb reading drifted half a pound.
    log('lb', 'completed');
    set('s1', 'lb', 'barbell-bench-press', 100 * 0.45359237, 20, Date.now());
    expect(fromKgHalf(sessionSummary('lb').volumeKg, 'lb')).toBe(2000);
  });

  it('lists every exercise with its top set in logging order and flags the records', () => {
    log('old', 'completed');
    set('o1', 'old', 'barbell-bench-press', 100, 5, 1_000);
    log('live', 'in_progress');
    set('s1', 'live', 'u1-row', 80, 8, 2_000);
    set('s2', 'live', 'barbell-bench-press', 100, 6, 3_000);
    set('s3', 'live', 'barbell-bench-press', 102.5, 3, 4_000);

    const summary = sessionSummary('live', 'es');
    expect(summary.exercises).toEqual([
      { exerciseId: 'u1-row', name: 'Pendlay Row', topKg: 80, topReps: 8, isPr: true },
      {
        exerciseId: 'barbell-bench-press',
        name: 'Press banca',
        topKg: 102.5,
        topReps: 3,
        isPr: true,
      },
    ]);
    expect(summary.prs).toEqual(['Pendlay Row', 'Press banca']);
    expect(summary.setCount).toBe(3);
  });

  it('a top set that only ties the old best is not a record', () => {
    log('old', 'completed');
    set('o1', 'old', 'barbell-bench-press', 100, 5, 1_000);
    log('live', 'in_progress');
    set('s1', 'live', 'barbell-bench-press', 100, 8, 2_000);

    const summary = sessionSummary('live');
    expect(summary.exercises[0]).toMatchObject({ topKg: 100, topReps: 8, isPr: false });
    expect(summary.prs).toEqual([]);
  });
});

describe('sessionSummary top exercise and plan', () => {
  const at = (day: number, hour = 18) => new Date(2026, 10, day, hour).getTime();
  const run = (
    id: string,
    dayId: string,
    startedAt: number,
    status: 'completed' | 'in_progress' = 'completed',
    snapshot: PlannedSlot[] = [],
  ) =>
    db
      .insert(workoutLogs)
      .values({
        id,
        userId: 'u1',
        userProgramId: 'up1',
        workoutDayId: dayId,
        weekNumber: 1,
        status,
        startedAt: new Date(startedAt),
        completedAt: status === 'completed' ? new Date(startedAt + 3_600_000) : null,
        durationSeconds: status === 'completed' ? 3600 : null,
        plannedSnapshot: snapshot,
      })
      .run();
  const planned = (exerciseId: string, sets: number, extra: Partial<PlannedSlot> = {}) => ({
    slotId: `slot-${exerciseId}`,
    exerciseId,
    name: exerciseId,
    setGroups: [{ sets, reps: 8 }],
    restSeconds: 120,
    badges: [],
    alternativeExerciseIds: [],
    ...extra,
  });

  beforeEach(() => {
    db.delete(setLogs).run();
    db.delete(workoutLogs).run();
    db.delete(exercises).run();
    db.insert(exercises)
      .values([
        { id: 'barbell-bench-press', name: 'Bench Press', category: 'chest', primaryMuscles: [] },
        { id: 'u1-row', name: 'Pendlay Row', category: 'back', primaryMuscles: [] },
      ])
      .run();
  });

  it('the top exercise is the one whose e1RM rose most against the last run of this split', () => {
    // Last week on split A: bench 100×5, row 80×8. On split B (another split): row 60×8.
    run('a-week1', 'day-a', at(17));
    set('p1', 'a-week1', 'barbell-bench-press', 100, 5, at(17, 18));
    set('p2', 'a-week1', 'u1-row', 80, 8, at(17, 19));
    run('b-week1', 'day-b', at(19));
    set('p3', 'b-week1', 'u1-row', 60, 8, at(19, 18));
    // Today on A: bench 102.5×5 (+2.5 %), row 85×8 (+6 %).
    run('a-week2', 'day-a', at(24));
    set('n1', 'a-week2', 'barbell-bench-press', 102.5, 5, at(24, 18));
    set('n2', 'a-week2', 'u1-row', 85, 8, at(24, 19));

    const { top } = sessionSummary('a-week2');
    expect(top).toMatchObject({ exerciseId: 'u1-row', reason: 'progress', topKg: 85, topReps: 8 });
    expect(top?.gain).toBeCloseTo(85 / 80 - 1);
  });

  it('a one-week routine compares with the last split of the same name in the enrollment', () => {
    // Foundations' phase 3: every week is its own routine, so every week's
    // "Side A" is a new split and the same-split rule finds nothing.
    db.delete(workoutDays).run();
    db.insert(workoutDays)
      .values([
        { id: 'w3-a', routineId: 'r3w3', name: 'Side A', orderIndex: 0 },
        { id: 'w4-a', routineId: 'r3w4', name: 'Side A', orderIndex: 0 },
        { id: 'w4-b', routineId: 'r3w4', name: 'Side B', orderIndex: 1 },
      ])
      .run();
    run('w3-run', 'w3-a', at(17));
    set('p1', 'w3-run', 'barbell-bench-press', 100, 5, at(17, 18));
    // Later, but another split: never "last time" for Side A.
    run('b-run', 'w4-b', at(20));
    set('p2', 'b-run', 'barbell-bench-press', 120, 5, at(20, 18));
    run('w4-run', 'w4-a', at(24));
    set('n1', 'w4-run', 'barbell-bench-press', 105, 5, at(24, 18));

    expect(previousSplitSession(getWorkout('w4-run')!)?.log.id).toBe('w3-run');
    // The very same split still wins when it has run before.
    run('w4-again', 'w4-a', at(26));
    expect(previousSplitSession(getWorkout('w4-again')!)?.log.id).toBe('w4-run');
  });

  it('a later run of the split is never "last time" for an earlier one', () => {
    run('a-week1', 'day-a', at(17));
    set('p1', 'a-week1', 'barbell-bench-press', 100, 5, at(17, 18));
    run('a-week2', 'day-a', at(24));
    set('n1', 'a-week2', 'barbell-bench-press', 90, 5, at(24, 18));
    // Read back from week 1: week 2 is later, so there is nothing to compare with.
    expect(sessionSummary('a-week1').top).toMatchObject({ reason: 'record' });
  });

  it('counts the plan without what was added today, and a skipped exercise misses only what was left', () => {
    run('live', 'day-a', at(24), 'in_progress', [
      planned('barbell-bench-press', 4, { skipped: { at: 1 } }),
      planned('u1-row', 3),
      planned('extra', 1, { added: { at: 1 } }),
    ]);
    set('n1', 'live', 'barbell-bench-press', 100, 5, at(24, 18));
    set('n2', 'live', 'barbell-bench-press', 100, 5, at(24, 19));
    const summary = sessionSummary('live');
    expect(summary.plannedSets).toBe(7);
    // Two of four bench sets were done before it was skipped: two missed, not four.
    expect(summary.missedSets).toBe(2);
  });
});

describe('sessionReport', () => {
  beforeEach(() => {
    db.delete(setLogs).run();
    db.delete(workoutLogs).run();
    db.delete(exercises).run();
    db.insert(exercises)
      .values([
        { id: 'barbell-bench-press', name: 'Bench Press', category: 'chest', primaryMuscles: [] },
      ])
      .run();
  });

  it('reads one session whole: its summary, each exercise in its language, last time and its time', () => {
    const start = new Date(2026, 10, 24, 18).getTime();
    db.insert(workoutLogs)
      .values([
        {
          id: 'before',
          userId: 'u1',
          userProgramId: 'up1',
          workoutDayId: 'day-a',
          weekNumber: 1,
          status: 'completed',
          startedAt: new Date(start - 7 * 86_400_000),
          completedAt: new Date(start - 7 * 86_400_000 + 3_000_000),
          durationSeconds: 3000,
        },
        {
          id: 'now',
          userId: 'u1',
          userProgramId: 'up1',
          workoutDayId: 'day-a',
          weekNumber: 2,
          status: 'completed',
          startedAt: new Date(start),
          completedAt: new Date(start + 900_000),
          durationSeconds: 900,
        },
      ])
      .run();
    set('b1', 'before', 'barbell-bench-press', 95, 5, start - 7 * 86_400_000 + 600_000);
    set('n1', 'now', 'barbell-bench-press', 100, 5, start + 600_000);
    db.update(setLogs).set({ restBeforeSeconds: 150 }).where(eq(setLogs.id, 'n1')).run();
    set('n2', 'now', 'barbell-bench-press', 100, 5, start + 800_000);
    db.update(setLogs).set({ restBeforeSeconds: 140 }).where(eq(setLogs.id, 'n2')).run();

    const report = sessionReport('now', 'u1', 'es')!;
    expect(report.summary.top).toMatchObject({ reason: 'progress' });
    expect(report.exercises.map((e) => e.name)).toEqual(['Press banca']);
    expect(report.vsLast).toMatchObject({ logId: 'before', weekNumber: 1, setsDelta: 1 });
    expect(report.timing).toMatchObject({ totalSeconds: 900, leadInSeconds: 600 });
    expect(sessionReport('missing', 'u1', 'en')).toBeNull();
    // Owner-scoped: the route is deep-linkable, another lifter reads nothing.
    expect(sessionReport('now', 'u2', 'en')).toBeNull();
  });

  it('reads an older session saved up to a late finish tap with the end at its last set', () => {
    // An older build saved two hours past the last set: that tail is no idle time.
    const start = new Date(2026, 10, 24, 18).getTime();
    db.insert(workoutLogs)
      .values({
        id: 'old',
        userId: 'u1',
        userProgramId: 'up1',
        workoutDayId: 'day-a',
        weekNumber: 1,
        status: 'completed',
        startedAt: new Date(start),
        completedAt: new Date(start + 3 * 3_600_000),
        durationSeconds: 3 * 3600,
      })
      .run();
    set('o1', 'old', 'barbell-bench-press', 100, 5, start + 600_000);
    set('o2', 'old', 'barbell-bench-press', 100, 5, start + 3_600_000);
    const report = sessionReport('old', 'u1', 'en')!;
    expect(report.timing).toMatchObject({ totalSeconds: 3600 });
  });
});
