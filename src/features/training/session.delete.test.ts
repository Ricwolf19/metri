import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  routines,
  setLogs,
  syncDeletions,
  trainingDays,
  userPrograms,
  users,
  workoutDays,
  workoutLogs,
  type UserProgramStatus,
} from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { deleteWorkout, finishWorkout, programSessionsQuery, startWorkout } =
  await import('./session.repo');

const UP = 'up1';

/** Two phases of two weeks, two splits each: p1 → (a1, b1), p2 → (a2, b2). */
const seedProgram = (position: { routineId: string; week: number; status?: UserProgramStatus }) => {
  db.insert(routines)
    .values([
      { id: 'p1', programId: 'prog', name: '', orderIndex: 0, durationWeeks: 2, userProgramId: UP },
      { id: 'p2', programId: 'prog', name: '', orderIndex: 1, durationWeeks: 2, userProgramId: UP },
    ])
    .run();
  db.insert(workoutDays)
    .values([
      { id: 'a1', routineId: 'p1', name: '', orderIndex: 0, userProgramId: UP },
      { id: 'b1', routineId: 'p1', name: '', orderIndex: 1, userProgramId: UP },
      { id: 'a2', routineId: 'p2', name: '', orderIndex: 0, userProgramId: UP },
      { id: 'b2', routineId: 'p2', name: '', orderIndex: 1, userProgramId: UP },
    ])
    .run();
  db.insert(userPrograms)
    .values({
      id: UP,
      userId: 'u1',
      programId: 'prog',
      status: position.status ?? 'active',
      currentRoutineId: position.routineId,
      currentWeek: position.week,
    })
    .run();
};

const finished = (
  id: string,
  dayId: string,
  week: number,
  completedAt = new Date(2026, 8, 20, 18),
) =>
  db
    .insert(workoutLogs)
    .values({
      id,
      userId: 'u1',
      userProgramId: UP,
      workoutDayId: dayId,
      weekNumber: week,
      status: 'completed',
      completedAt,
    })
    .run();

const position = () => {
  const [row] = db.select().from(userPrograms).where(eq(userPrograms.id, UP)).all();
  return { routineId: row.currentRoutineId, week: row.currentWeek, status: row.status };
};

describe('deleteWorkout', () => {
  beforeEach(() => {
    for (const t of [setLogs, workoutLogs, trainingDays, workoutDays, routines, userPrograms]) {
      db.delete(t).run();
    }
    db.delete(syncDeletions).run();
    db.delete(users).run();
    db.insert(users).values({ id: 'u1', email: null, authKind: 'local' }).run();
  });

  it('removes the session and its sets and tombstones both for sync', () => {
    seedProgram({ routineId: 'p1', week: 1 });
    finished('l1', 'a1', 1);
    db.insert(setLogs)
      .values({
        id: 's1',
        workoutLogId: 'l1',
        exerciseId: 'e',
        setNumber: 1,
        weightKg: 60,
        reps: 8,
      })
      .run();

    deleteWorkout('l1');

    expect(db.select().from(workoutLogs).all()).toHaveLength(0);
    expect(db.select().from(setLogs).all()).toHaveLength(0);
    const tombstones = db.select().from(syncDeletions).all();
    expect(tombstones.map((t) => [t.tableName, t.rowId]).sort()).toEqual([
      ['set_logs', 's1'],
      ['workout_logs', 'l1'],
    ]);
  });

  // The reported bug: fake sessions finished week 1 and nothing could undo it.
  it('rewinds to the week the deleted session left incomplete', () => {
    seedProgram({ routineId: 'p1', week: 2 });
    finished('l1', 'a1', 1);
    finished('l2', 'b1', 1);

    expect(deleteWorkout('l2')).toBe(true);

    expect(position()).toMatchObject({ routineId: 'p1', week: 1 });
  });

  it('rewinds across a phase boundary', () => {
    seedProgram({ routineId: 'p2', week: 1 });
    finished('l1', 'a1', 2);
    finished('l2', 'b1', 2);

    deleteWorkout('l1');

    expect(position()).toMatchObject({ routineId: 'p1', week: 2 });
  });

  it('leaves the position alone when a repeat still covers the week', () => {
    seedProgram({ routineId: 'p1', week: 2 });
    finished('l1', 'a1', 1);
    finished('l2', 'b1', 1);
    finished('l3', 'b1', 1);

    expect(deleteWorkout('l3')).toBe(false);

    expect(position()).toMatchObject({ routineId: 'p1', week: 2 });
  });

  it('does not move when the session belongs to the current week', () => {
    seedProgram({ routineId: 'p1', week: 2 });
    finished('l1', 'a1', 2);

    expect(deleteWorkout('l1')).toBe(false);

    expect(position()).toMatchObject({ routineId: 'p1', week: 2 });
  });

  // A lifter who jumped ahead by hand never did the earlier weeks; deleting a
  // later session must not drag them back past where they chose to be.
  it('never rewinds further back than the deleted week', () => {
    seedProgram({ routineId: 'p2', week: 2 });
    finished('l1', 'a2', 1);
    finished('l2', 'b2', 1);

    deleteWorkout('l1');

    expect(position()).toMatchObject({ routineId: 'p2', week: 1 });
  });

  it('reopens a program the deleted session had completed', () => {
    seedProgram({ routineId: 'p2', week: 2, status: 'completed' });
    finished('l1', 'a2', 2);
    finished('l2', 'b2', 2);

    deleteWorkout('l2');

    expect(position()).toEqual({ routineId: 'p2', week: 2, status: 'active' });
  });

  it('keeps a completed program closed once another is enrolled', () => {
    seedProgram({ routineId: 'p2', week: 2, status: 'completed' });
    db.insert(userPrograms)
      .values({ id: 'up2', userId: 'u1', programId: 'other', status: 'active', currentWeek: 1 })
      .run();
    finished('l1', 'a2', 2);

    expect(deleteWorkout('l1')).toBe(false);

    expect(position().status).toBe('completed');
  });

  it('rewinds a paused program like an active one', () => {
    seedProgram({ routineId: 'p1', week: 2, status: 'paused' });
    finished('l1', 'a1', 1);
    finished('l2', 'b1', 1);

    deleteWorkout('l1');

    expect(position()).toMatchObject({ routineId: 'p1', week: 1, status: 'paused' });
  });

  // An abandoned program's copy is gone; its old sessions are plain history.
  it('never moves an abandoned program', () => {
    seedProgram({ routineId: 'p1', week: 2, status: 'abandoned' });
    finished('l1', 'a1', 1);

    expect(deleteWorkout('l1')).toBe(false);

    expect(position()).toMatchObject({ routineId: 'p1', week: 2, status: 'abandoned' });
  });

  it('hands the day to another session finished that day', () => {
    seedProgram({ routineId: 'p1', week: 1 });
    finished('l1', 'a1', 1, new Date(2026, 8, 20, 9));
    finished('l2', 'b1', 1, new Date(2026, 8, 20, 18));
    db.insert(trainingDays)
      .values({
        id: 'd1',
        userId: 'u1',
        date: '2026-09-20',
        status: 'trained',
        workoutLogId: 'l2',
        workoutDayId: 'b1',
      })
      .run();

    deleteWorkout('l2');

    const [day] = db.select().from(trainingDays).all();
    expect(day).toMatchObject({ workoutLogId: 'l1', workoutDayId: 'a1', status: 'trained' });
  });

  it('clears the day mark when no session is left on it', () => {
    seedProgram({ routineId: 'p1', week: 1 });
    finished('l1', 'a1', 1);
    db.insert(trainingDays)
      .values({
        id: 'd1',
        userId: 'u1',
        date: '2026-09-20',
        status: 'trained',
        workoutLogId: 'l1',
        workoutDayId: 'a1',
      })
      .run();

    deleteWorkout('l1');

    expect(db.select().from(trainingDays).all()).toHaveLength(0);
    expect(
      db
        .select()
        .from(syncDeletions)
        .all()
        .some((t) => t.tableName === 'training_days'),
    ).toBe(true);
  });

  it('does not hand the day to a session finished the next day', () => {
    seedProgram({ routineId: 'p1', week: 1 });
    finished('l1', 'a1', 1, new Date(2026, 8, 20, 18));
    finished('l2', 'b1', 1, new Date(2026, 8, 21, 0, 5));
    db.insert(trainingDays)
      .values({
        id: 'd1',
        userId: 'u1',
        date: '2026-09-20',
        status: 'trained',
        workoutLogId: 'l1',
        workoutDayId: 'a1',
      })
      .run();

    deleteWorkout('l1');

    expect(db.select().from(trainingDays).all()).toHaveLength(0);
  });

  it('keeps a day the lifter re-marked by hand', () => {
    seedProgram({ routineId: 'p1', week: 1 });
    finished('l1', 'a1', 1);
    db.insert(trainingDays)
      .values({ id: 'd1', userId: 'u1', date: '2026-09-20', status: 'rest' })
      .run();

    deleteWorkout('l1');

    expect(db.select().from(trainingDays).all()).toHaveLength(1);
  });
});

describe('repeating a split', () => {
  beforeEach(() => {
    for (const t of [setLogs, workoutLogs, trainingDays, workoutDays, routines, userPrograms]) {
      db.delete(t).run();
    }
  });

  // History is append-only: a redo is a second record, never a rewrite.
  it('keeps the earlier session and its sets untouched', () => {
    seedProgram({ routineId: 'p1', week: 1 });
    const first = startWorkout('u1', UP, 'a1', 1);
    db.insert(setLogs)
      .values({
        id: 's1',
        workoutLogId: first.id,
        exerciseId: 'e',
        setNumber: 1,
        weightKg: 60,
        reps: 8,
      })
      .run();
    finishWorkout(first.id);

    const again = startWorkout('u1', UP, 'a1', 1);
    finishWorkout(again.id);

    expect(again.id).not.toBe(first.id);
    expect(db.select().from(workoutLogs).all()).toHaveLength(2);
    expect(db.select().from(setLogs).where(eq(setLogs.workoutLogId, first.id)).all()).toHaveLength(
      1,
    );
  });
});

describe('programSessionsQuery', () => {
  beforeEach(() => {
    for (const t of [setLogs, workoutLogs, trainingDays, workoutDays, routines, userPrograms]) {
      db.delete(t).run();
    }
  });

  it('totals working sets only and lists finished sessions of the program', () => {
    seedProgram({ routineId: 'p1', week: 1 });
    finished('l1', 'a1', 1);
    db.insert(workoutLogs)
      .values({ id: 'open', userId: 'u1', userProgramId: UP, workoutDayId: 'b1', weekNumber: 1 })
      .run();
    db.insert(setLogs)
      .values([
        { id: 's1', workoutLogId: 'l1', exerciseId: 'e', setNumber: 1, weightKg: 100, reps: 5 },
        {
          id: 's2',
          workoutLogId: 'l1',
          exerciseId: 'e',
          setNumber: 2,
          weightKg: 40,
          reps: 10,
          isWarmup: true,
        },
      ])
      .run();

    const rows = programSessionsQuery(UP).all();

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'l1', routineId: 'p1', setCount: 1, volumeKg: 500 });
  });
});
