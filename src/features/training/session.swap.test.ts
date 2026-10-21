import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  exercises,
  setLogs,
  userPrograms,
  users,
  workoutDayExercises,
  workoutDays,
  workoutLogs,
  routines,
} from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const {
  applySwap,
  logSet,
  markRemainingSkipped,
  sessionSummary,
  skipSnapshotExercise,
  skipSnapshotSet,
  startWorkout,
} = await import('./session.repo');

const U = 'u-1';
const UP = 'up-1';
const SLOT = 'slot-bench';
const TEMPLATE_SLOT = 'slot-template';

const slotRow = () =>
  db.select().from(workoutDayExercises).where(eq(workoutDayExercises.id, SLOT)).all()[0];
const snapshot = (logId: string) =>
  db.select().from(workoutLogs).where(eq(workoutLogs.id, logId)).all()[0].plannedSnapshot!;

describe('swap scopes and skipped sets', () => {
  beforeEach(() => {
    for (const t of [
      setLogs,
      workoutLogs,
      workoutDayExercises,
      workoutDays,
      routines,
      userPrograms,
      exercises,
      users,
    ])
      db.delete(t).run();
    db.insert(users).values({ id: U, email: null, authKind: 'local' }).run();
    db.insert(exercises)
      .values([
        { id: 'bench', name: 'Bench', category: 'chest', primaryMuscles: ['chest'] },
        { id: 'db-bench', name: 'DB Bench', category: 'chest', primaryMuscles: ['chest'] },
        { id: 'fly', name: 'Fly', category: 'chest', primaryMuscles: ['chest'] },
      ])
      .run();
    db.insert(userPrograms)
      .values({
        id: UP,
        userId: U,
        programId: 'prog',
        status: 'active',
        currentRoutineId: 'r',
        currentWeek: 1,
      })
      .run();
    db.insert(routines)
      .values({ id: 'r', programId: 'prog', name: '', orderIndex: 0, userProgramId: UP })
      .run();
    db.insert(workoutDays)
      .values({ id: 'day', routineId: 'r', name: '', orderIndex: 0, userProgramId: UP })
      .run();
    db.insert(workoutDayExercises)
      .values([
        { id: SLOT, workoutDayId: 'day', exerciseId: 'bench', orderIndex: 0, userProgramId: UP },
        {
          id: 'slot-fly',
          workoutDayId: 'day',
          exerciseId: 'fly',
          orderIndex: 1,
          userProgramId: UP,
        },
        {
          id: TEMPLATE_SLOT,
          workoutDayId: 'tpl-day',
          exerciseId: 'bench',
          orderIndex: 0,
          userProgramId: null,
        },
      ])
      .run();
  });

  const start = () => startWorkout(U, UP, 'day', 1);

  it('"this session" only rewrites the snapshot and records the reason', () => {
    const log = start();
    applySwap({
      logId: log.id,
      slotId: SLOT,
      exerciseId: 'db-bench',
      exerciseName: 'DB Bench',
      reason: 'busy',
      scope: { kind: 'session' },
    });
    expect(snapshot(log.id)[0]).toMatchObject({
      exerciseId: 'db-bench',
      originalExerciseId: 'bench',
      swapReason: 'busy',
    });
    expect(slotRow()).toMatchObject({ exerciseId: 'bench', swap: null });
  });

  it('"next N sessions" counts down through the following starts, then the slot returns', () => {
    const log = start();
    applySwap({
      logId: log.id,
      slotId: SLOT,
      exerciseId: 'db-bench',
      exerciseName: 'DB Bench',
      reason: 'discomfort',
      scope: { kind: 'sessions', count: 3 },
    });
    expect(slotRow().swap).toEqual({
      exerciseId: 'db-bench',
      sessionsLeft: 2,
      reason: 'discomfort',
    });

    const second = start();
    expect(snapshot(second.id)[0]).toMatchObject({
      exerciseId: 'db-bench',
      name: 'DB Bench',
      originalExerciseId: 'bench',
      swapReason: 'discomfort',
    });
    expect(slotRow().swap).toMatchObject({ sessionsLeft: 1 });

    const third = start();
    expect(snapshot(third.id)[0].exerciseId).toBe('db-bench');
    expect(slotRow().swap).toBeNull();

    const fourth = start();
    expect(snapshot(fourth.id)[0]).toMatchObject({ exerciseId: 'bench' });
    expect(snapshot(fourth.id)[0].originalExerciseId).toBeUndefined();
  });

  it('"rest of the cycle" rewrites the enrolled slot and keeps the original as an alternative', () => {
    const log = start();
    applySwap({
      logId: log.id,
      slotId: SLOT,
      exerciseId: 'db-bench',
      exerciseName: 'DB Bench',
      reason: 'preference',
      scope: { kind: 'cycle' },
    });
    expect(slotRow()).toMatchObject({
      exerciseId: 'db-bench',
      alternativeExerciseIds: ['bench'],
      swap: null,
    });
    expect(snapshot(start().id)[0]).toMatchObject({ exerciseId: 'db-bench' });
  });

  it('takes the cycle swap on a copy enrolled before slots carried a program id', () => {
    // Trees enrolled before migration 0008 (the owner's v1 data) have NULL
    // `user_program_id` on their slots; the day of the session proves the slot
    // is enrolled, and the column is backfilled on the way.
    db.update(workoutDayExercises)
      .set({ userProgramId: null })
      .where(eq(workoutDayExercises.id, SLOT))
      .run();
    const log = start();
    applySwap({
      logId: log.id,
      slotId: SLOT,
      exerciseId: 'db-bench',
      exerciseName: 'DB Bench',
      reason: 'preference',
      scope: { kind: 'cycle' },
    });
    expect(slotRow()).toMatchObject({
      exerciseId: 'db-bench',
      alternativeExerciseIds: ['bench'],
      userProgramId: UP,
    });
  });

  it('never touches a template slot', () => {
    const log = start();
    applySwap({
      logId: log.id,
      slotId: TEMPLATE_SLOT,
      exerciseId: 'db-bench',
      exerciseName: 'DB Bench',
      reason: 'preference',
      scope: { kind: 'cycle' },
    });
    const [tpl] = db
      .select()
      .from(workoutDayExercises)
      .where(eq(workoutDayExercises.id, TEMPLATE_SLOT))
      .all();
    expect(tpl).toMatchObject({ exerciseId: 'bench', swap: null });
  });

  it('skipping a set or an exercise lands in the snapshot and can be undone', () => {
    const log = start();
    skipSnapshotSet(log.id, SLOT, 1, true);
    skipSnapshotSet(log.id, SLOT, 0, true);
    expect(snapshot(log.id)[0].skippedSets).toEqual([0, 1]);
    skipSnapshotSet(log.id, SLOT, 0, false);
    expect(snapshot(log.id)[0].skippedSets).toEqual([1]);
    skipSnapshotSet(log.id, SLOT, 1, false);
    expect(snapshot(log.id)[0].skippedSets).toBeUndefined();

    skipSnapshotExercise(log.id, 'slot-fly', true);
    expect(snapshot(log.id)[1].skipped).toMatchObject({ at: expect.any(Number) });
    skipSnapshotExercise(log.id, 'slot-fly', false);
    expect(snapshot(log.id)[1].skipped).toBeUndefined();
  });

  it('markRemainingSkipped fills every open ordinal and the summary counts them as missed', () => {
    const log = start();
    // Default prescription: 3 sets per slot. One bench set logged, fly untouched.
    logSet({ workoutLogId: log.id, exerciseId: 'bench', weightKg: 80, reps: 8 });
    skipSnapshotSet(log.id, SLOT, 2, true);
    markRemainingSkipped(log.id);
    const [bench, fly] = snapshot(log.id);
    expect(bench.skippedSets).toEqual([1, 2]);
    expect(fly.skippedSets).toEqual([0, 1, 2]);
    expect(sessionSummary(log.id).missedSets).toBe(5);
  });
});
