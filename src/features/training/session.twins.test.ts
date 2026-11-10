import { asc, eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  exercises,
  exerciseSettings,
  programs,
  routines,
  setLogs,
  userPrograms,
  users,
  weekConfigs,
  workoutDayExercises,
  workoutDays,
  workoutLogs,
} from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { applySwap, startWorkout } = await import('./session.repo');
const { reorderSplitFromNowOn } = await import('./authoring.repo');
const { addSessionExercise } = await import('./session-add');

const U = 'u-1';
const UP = 'up-1';

/**
 * A phase whose splits repeat each other (full body A/B), a split that only
 * shares some exercises (C), and the next phase with the same exercise (D):
 * "from now on" reaches A's twin, never C's partial overlap or another phase.
 */
const seed = () => {
  for (const t of [
    setLogs,
    workoutLogs,
    weekConfigs,
    workoutDayExercises,
    workoutDays,
    routines,
    userPrograms,
    programs,
    exerciseSettings,
    exercises,
    users,
  ])
    db.delete(t).run();
  db.insert(users).values({ id: U, email: null, authKind: 'local' }).run();
  db.insert(exercises)
    .values(
      ['squat', 'bench', 'row', 'db-bench', 'curl', 'pulldown'].map((id) => ({
        id,
        name: id,
        category: 'chest' as const,
        primaryMuscles: ['chest'],
      })),
    )
    .run();
  db.insert(programs).values({ id: 'prog', userId: U, name: 'P', durationWeeks: 4 }).run();
  db.insert(userPrograms)
    .values({
      id: UP,
      userId: U,
      programId: 'prog',
      status: 'active',
      currentRoutineId: 'r1',
      currentWeek: 1,
    })
    .run();
  db.insert(routines)
    .values([
      { id: 'r1', programId: 'prog', name: '', orderIndex: 0, userProgramId: UP, durationWeeks: 4 },
      { id: 'r2', programId: 'prog', name: '', orderIndex: 1, userProgramId: UP, durationWeeks: 4 },
    ])
    .run();
  db.insert(workoutDays)
    .values([
      { id: 'a', routineId: 'r1', name: '', orderIndex: 0, userProgramId: UP },
      { id: 'b', routineId: 'r1', name: '', orderIndex: 1, userProgramId: UP },
      { id: 'c', routineId: 'r1', name: '', orderIndex: 2, userProgramId: UP },
      { id: 'd', routineId: 'r2', name: '', orderIndex: 0, userProgramId: UP },
    ])
    .run();
  const slots = (day: string, ids: string[]) =>
    ids.map((exerciseId, orderIndex) => ({
      id: `${day}-${orderIndex}`,
      workoutDayId: day,
      exerciseId,
      orderIndex,
      userProgramId: UP,
    }));
  db.insert(workoutDayExercises)
    .values([
      ...slots('a', ['squat', 'bench', 'row', 'pulldown', 'pulldown']),
      ...slots('b', ['squat', 'bench', 'row', 'pulldown', 'pulldown']),
      ...slots('c', ['bench', 'squat', 'curl']),
      ...slots('d', ['squat', 'bench', 'row']),
    ])
    .run();
};

const orderOf = (day: string) =>
  db
    .select({ id: workoutDayExercises.id })
    .from(workoutDayExercises)
    .where(eq(workoutDayExercises.workoutDayId, day))
    .orderBy(asc(workoutDayExercises.orderIndex))
    .all()
    .map((r) => r.id);
const slot = (id: string) =>
  db.select().from(workoutDayExercises).where(eq(workoutDayExercises.id, id)).all()[0];
const snapshot = (logId: string) =>
  db.select().from(workoutLogs).where(eq(workoutLogs.id, logId)).all()[0].plannedSnapshot!;
const swapBench = (logId: string, scope: Parameters<typeof applySwap>[0]['scope']) =>
  applySwap({
    logId,
    slotId: 'a-1',
    exerciseId: 'db-bench',
    exerciseName: 'db-bench',
    reason: 'preference',
    scope,
  });

describe('"from now on" reaches the twin splits of the phase', () => {
  beforeEach(seed);

  it('a cycle swap rewrites the same exercise on every split of the phase, never another phase', () => {
    swapBench(startWorkout(U, UP, 'a', 1).id, { kind: 'cycle' });
    expect(slot('a-1').exerciseId).toBe('db-bench');
    expect(slot('b-1')).toMatchObject({
      exerciseId: 'db-bench',
      alternativeExerciseIds: ['bench'],
    });
    // A split that shares the exercise is still the same exercise in the same phase.
    expect(slot('c-0').exerciseId).toBe('db-bench');
    expect(slot('d-1').exerciseId).toBe('bench');
  });

  it('"next N sessions" counts sessions of the exercise, whichever split they fall on', () => {
    swapBench(startWorkout(U, UP, 'a', 1).id, { kind: 'sessions', count: 3 });
    expect(slot('b-1').swap).toMatchObject({ exerciseId: 'db-bench', sessionsLeft: 2 });

    // B and C each spend one of the shared two.
    expect(snapshot(startWorkout(U, UP, 'b', 1).id)[1].exerciseId).toBe('db-bench');
    expect(slot('a-1').swap).toMatchObject({ sessionsLeft: 1 });
    expect(snapshot(startWorkout(U, UP, 'c', 1).id)[0].exerciseId).toBe('db-bench');
    expect(slot('a-1').swap).toBeNull();
    expect(slot('b-1').swap).toBeNull();
    expect(snapshot(startWorkout(U, UP, 'a', 1).id)[1].exerciseId).toBe('bench');
  });

  it('a reorder kept from now on reorders the identical split and leaves the others', () => {
    reorderSplitFromNowOn('a', ['a-2', 'a-0', 'a-1', 'a-3', 'a-4']);
    expect(orderOf('a')).toEqual(['a-2', 'a-0', 'a-1', 'a-3', 'a-4']);
    expect(orderOf('b')).toEqual(['b-2', 'b-0', 'b-1', 'b-3', 'b-4']);
    expect(orderOf('c')).toEqual(['c-0', 'c-1', 'c-2']);
    expect(orderOf('d')).toEqual(['d-0', 'd-1', 'd-2']);
  });

  it('pairs a repeated exercise with its own twin (the second pulldown stays the second)', () => {
    reorderSplitFromNowOn('a', ['a-4', 'a-0', 'a-1', 'a-2', 'a-3']);
    expect(orderOf('b')).toEqual(['b-4', 'b-0', 'b-1', 'b-2', 'b-3']);
  });

  it('ignores a slot added for today only', () => {
    reorderSplitFromNowOn('a', ['today-only', 'a-1', 'a-0', 'a-2', 'a-3', 'a-4']);
    expect(orderOf('a')).toEqual(['a-1', 'a-0', 'a-2', 'a-3', 'a-4']);
  });
});

describe('adding an exercise to a live session', () => {
  beforeEach(seed);

  it('today only: the snapshot gains it, the split does not', () => {
    const log = startWorkout(U, UP, 'c', 1);
    const entry = addSessionExercise({
      logId: log.id,
      userId: U,
      exerciseId: 'row',
      keep: false,
      locale: 'en',
    });
    expect(snapshot(log.id).at(-1)).toMatchObject({
      exerciseId: 'row',
      added: { at: expect.any(Number) },
      setGroups: [{ sets: 1, reps: 8 }],
    });
    expect(orderOf('c')).not.toContain(entry?.slotId);
    expect(orderOf('c')).toHaveLength(3);
  });

  it('kept: the split gains a real slot and the snapshot points at it', () => {
    const log = startWorkout(U, UP, 'c', 2);
    const entry = addSessionExercise({
      logId: log.id,
      userId: U,
      exerciseId: 'row',
      keep: true,
      locale: 'en',
    });
    expect(orderOf('c').at(-1)).toBe(entry?.slotId);
    expect(snapshot(log.id).at(-1)?.slotId).toBe(entry?.slotId);
    // The next session of the split opens with it.
    expect(snapshot(startWorkout(U, UP, 'c', 2).id).map((p) => p.exerciseId)).toContain('row');
  });
});
