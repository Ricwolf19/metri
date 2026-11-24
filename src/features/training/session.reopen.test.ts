import { and, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  routines,
  setLogs,
  trainingDays,
  userPrograms,
  users,
  workoutDays,
  workoutLogs,
} from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { markTrainingDay } = await import('./adherence.repo');
const {
  activeWorkoutQuery,
  completedDaysQuery,
  finishWorkout,
  previousSessionSets,
  programSessionsQuery,
  reopenWorkout,
} = await import('./session.repo');

const UP = 'up1';
const MIN = 60_000;
/** Monday 24 Nov 2026, 18:00 local. */
const START = new Date(2026, 10, 24, 18, 0).getTime();

const open = (id: string, dayId = 'a1', startedAt = START, userId = 'u1') =>
  db
    .insert(workoutLogs)
    .values({
      id,
      userId,
      userProgramId: UP,
      workoutDayId: dayId,
      weekNumber: 1,
      status: 'in_progress',
      startedAt: new Date(startedAt),
      plannedSnapshot: [],
    })
    .run();

const completed = (id: string, dayId: string) =>
  db
    .insert(workoutLogs)
    .values({
      id,
      userId: 'u1',
      userProgramId: UP,
      workoutDayId: dayId,
      weekNumber: 1,
      status: 'completed',
      startedAt: new Date(START - 2 * 24 * 60 * MIN),
      completedAt: new Date(START - 2 * 24 * 60 * MIN + 60 * MIN),
      durationSeconds: 3600,
    })
    .run();

const set = (id: string, logId: string, at: number) =>
  db
    .insert(setLogs)
    .values({
      id,
      workoutLogId: logId,
      exerciseId: 'bench',
      setNumber: 1,
      weightKg: 100,
      reps: 5,
      createdAt: new Date(at),
    })
    .run();

const log = (id: string) => db.select().from(workoutLogs).where(eq(workoutLogs.id, id)).all()[0];
const mark = (date: string) =>
  db
    .select()
    .from(trainingDays)
    .where(and(eq(trainingDays.userId, 'u1'), eq(trainingDays.date, date)))
    .all()[0];
const position = () => {
  const [row] = db.select().from(userPrograms).where(eq(userPrograms.id, UP)).all();
  return { routineId: row.currentRoutineId, week: row.currentWeek };
};
/** Finish as if the tap landed at `at`. */
const finishAt = (id: string, at: number) => {
  vi.setSystemTime(at);
  finishWorkout(id);
};

describe('finishing a session ends it at its last activity', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    for (const t of [
      setLogs,
      workoutLogs,
      trainingDays,
      workoutDays,
      routines,
      userPrograms,
      users,
    ])
      db.delete(t).run();
    db.insert(users).values({ id: 'u1', email: null, authKind: 'local' }).run();
  });
  afterEach(() => vi.useRealTimers());

  it('finished right after the last set, it ends at the finish', () => {
    open('l1');
    set('s1', 'l1', START + 60 * MIN);
    finishAt('l1', START + 62 * MIN);
    expect(log('l1')).toMatchObject({
      status: 'completed',
      completedAt: new Date(START + 62 * MIN),
      durationSeconds: 62 * 60,
    });
    expect(mark('2026-11-24')).toMatchObject({ status: 'trained', workoutLogId: 'l1' });
  });

  it('saved the next morning, it ends at its last set and marks the day it was trained', () => {
    open('l1');
    set('s1', 'l1', START + 40 * MIN);
    set('s2', 'l1', START + 70 * MIN);
    finishAt('l1', new Date(2026, 10, 25, 9, 0).getTime());
    expect(log('l1')).toMatchObject({
      completedAt: new Date(START + 70 * MIN),
      durationSeconds: 70 * 60,
    });
    expect(mark('2026-11-24')).toMatchObject({ status: 'trained' });
    expect(mark('2026-11-25')).toBeUndefined();
  });

  it('a second finish (a double tap, the stale prompt racing the screen) changes nothing', () => {
    open('l1');
    set('s1', 'l1', START + 50 * MIN);
    finishAt('l1', START + 51 * MIN);
    const first = log('l1');
    finishAt('l1', START + 70 * MIN);
    expect(log('l1').completedAt).toEqual(first.completedAt);
    expect(log('l1').durationSeconds).toBe(first.durationSeconds);
  });
});

describe('reopenWorkout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    for (const t of [
      setLogs,
      workoutLogs,
      trainingDays,
      workoutDays,
      routines,
      userPrograms,
      users,
    ])
      db.delete(t).run();
    db.insert(users).values({ id: 'u1', email: null, authKind: 'local' }).run();
  });
  afterEach(() => vi.useRealTimers());

  it('reopens a completed session of its owner and keeps the first finish as the marker', () => {
    open('l1');
    set('s1', 'l1', START + 60 * MIN);
    finishAt('l1', START + 60 * MIN);
    expect(reopenWorkout('l1', 'u1')).toBe(true);
    expect(log('l1')).toMatchObject({
      status: 'in_progress',
      completedAt: new Date(START + 60 * MIN),
    });
    // It is the open session again, never "finished" while open.
    expect(
      activeWorkoutQuery('u1')
        .all()
        .map((r) => r.id),
    ).toEqual(['l1']);
  });

  it("refuses another lifter's session, an open one and an abandoned one", () => {
    open('l1');
    finishAt('l1', START + 30 * MIN);
    expect(reopenWorkout('l1', 'someone-else')).toBe(false);
    open('l2', 'a1', START + 120 * MIN);
    expect(reopenWorkout('l2', 'u1')).toBe(false);
    db.update(workoutLogs).set({ status: 'abandoned' }).where(eq(workoutLogs.id, 'l2')).run();
    expect(reopenWorkout('l2', 'u1')).toBe(false);
  });

  it('refuses while another session is open: one in-progress session per lifter', () => {
    open('l1');
    finishAt('l1', START + 30 * MIN);
    open('l2', 'b1', START + 60 * MIN);
    expect(reopenWorkout('l1', 'u1')).toBe(false);
    expect(log('l1').status).toBe('completed');
  });

  it('finished again with nothing added, it keeps its first end however long it sat open', () => {
    open('l1');
    set('s1', 'l1', START + 60 * MIN);
    finishAt('l1', START + 61 * MIN);
    reopenWorkout('l1', 'u1');
    finishAt('l1', START + 4 * 60 * MIN);
    expect(log('l1')).toMatchObject({
      status: 'completed',
      completedAt: new Date(START + 61 * MIN),
      durationSeconds: 61 * 60,
    });
  });

  it('a set added after reopening moves the end; past midnight the session keeps its first day', () => {
    const late = new Date(2026, 10, 24, 23, 0).getTime();
    open('l1', 'a1', late);
    set('s1', 'l1', late + 49 * MIN);
    finishAt('l1', late + 50 * MIN);
    reopenWorkout('l1', 'u1');
    // 00:05 on the 25th: one more set, then finished again.
    set('s2', 'l1', late + 65 * MIN);
    finishAt('l1', late + 66 * MIN);
    expect(log('l1')).toMatchObject({
      completedAt: new Date(late + 50 * MIN),
      durationSeconds: 65 * 60,
    });
    expect(mark('2026-11-24')).toMatchObject({ status: 'trained', workoutLogId: 'l1' });
    expect(mark('2026-11-25')).toBeUndefined();
  });

  it('a re-finish leaves a day mark the lifter changed since: it is theirs', () => {
    open('l1');
    set('s1', 'l1', START + 60 * MIN);
    finishAt('l1', START + 60 * MIN);
    markTrainingDay('u1', { date: '2026-11-24', status: 'active' });
    reopenWorkout('l1', 'u1');
    finishAt('l1', START + 70 * MIN);
    expect(mark('2026-11-24').status).toBe('active');
  });
});

describe('a reopened session and the program', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    for (const t of [
      setLogs,
      workoutLogs,
      trainingDays,
      workoutDays,
      routines,
      userPrograms,
      users,
    ])
      db.delete(t).run();
    db.insert(users).values({ id: 'u1', email: null, authKind: 'local' }).run();
    // One phase of two weeks, two splits; week 1 of split b is already done.
    db.insert(routines)
      .values([
        {
          id: 'p1',
          programId: 'prog',
          name: '',
          orderIndex: 0,
          durationWeeks: 2,
          userProgramId: UP,
        },
        {
          id: 'p2',
          programId: 'prog',
          name: '',
          orderIndex: 1,
          durationWeeks: 2,
          userProgramId: UP,
        },
      ])
      .run();
    db.insert(workoutDays)
      .values([
        { id: 'a1', routineId: 'p1', name: '', orderIndex: 0, userProgramId: UP },
        { id: 'b1', routineId: 'p1', name: '', orderIndex: 1, userProgramId: UP },
        { id: 'a2', routineId: 'p2', name: '', orderIndex: 0, userProgramId: UP },
      ])
      .run();
    db.insert(userPrograms)
      .values({
        id: UP,
        userId: 'u1',
        programId: 'prog',
        status: 'active',
        currentRoutineId: 'p1',
        currentWeek: 1,
      })
      .run();
    completed('b-done', 'b1');
  });
  afterEach(() => vi.useRealTimers());

  it('finishing it again never advances the program twice', () => {
    open('l1', 'a1');
    set('s1', 'l1', START + 60 * MIN);
    finishAt('l1', START + 60 * MIN);
    // The week is complete: the plan moved on to week 2.
    expect(position()).toEqual({ routineId: 'p1', week: 2 });

    reopenWorkout('l1', 'u1');
    // Open again, it is not a finished session anywhere: history, the week, "Last training".
    expect(
      programSessionsQuery(UP)
        .all()
        .map((r) => r.id),
    ).toEqual(['b-done']);
    expect(
      completedDaysQuery(UP, 1)
        .all()
        .map((r) => r.dayId),
    ).toEqual(['b1']);
    expect(previousSessionSets('bench')).toBeNull();
    // …and the program did not rewind for it.
    expect(position()).toEqual({ routineId: 'p1', week: 2 });

    set('s2', 'l1', START + 65 * MIN);
    finishAt('l1', START + 66 * MIN);
    // Still week 2: the cursor week (2) is not complete, so nothing moved.
    expect(position()).toEqual({ routineId: 'p1', week: 2 });
    expect(
      programSessionsQuery(UP)
        .all()
        .map((r) => r.id)
        .sort(),
    ).toEqual(['b-done', 'l1']);
  });
});
