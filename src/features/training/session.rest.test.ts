import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  exerciseSettings,
  exercises,
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
const { applySwap, logSet, markRemainingSkipped, sessionSummary, startWorkout, finishWorkout } =
  await import('./session.repo');
const { addSessionExercise } = await import('./session-add');

const U = 'u-1';
const UP = 'up-1';
const SLOT = 'slot-a';

const snapshotOf = (logId: string) =>
  db.select().from(workoutLogs).where(eq(workoutLogs.id, logId)).all()[0].plannedSnapshot!;
const slotById = (id: string) =>
  db.select().from(workoutDayExercises).where(eq(workoutDayExercises.id, id)).all()[0];

const swap = (logId: string, exerciseId: string, scope: Parameters<typeof applySwap>[0]['scope']) =>
  applySwap({
    logId,
    slotId: SLOT,
    exerciseId,
    exerciseName: exerciseId,
    reason: 'busy',
    scope,
  });

describe('rest follows the exercise', () => {
  beforeEach(() => {
    for (const t of [
      setLogs,
      workoutLogs,
      weekConfigs,
      workoutDayExercises,
      workoutDays,
      routines,
      userPrograms,
      exerciseSettings,
      exercises,
      users,
    ])
      db.delete(t).run();
    db.insert(users).values({ id: U, email: null, authKind: 'local' }).run();
    db.insert(exercises)
      .values([
        {
          id: 'back-extension',
          name: 'Back Extension',
          category: 'back',
          primaryMuscles: ['lower_back'],
          secondaryMuscles: ['glutes'],
        },
        {
          id: 'deadlift',
          name: 'Deadlift',
          category: 'back',
          primaryMuscles: ['lower_back', 'glutes', 'hamstrings'],
          secondaryMuscles: ['quads'],
        },
        { id: 'curl', name: 'Curl', category: 'arms', primaryMuscles: ['biceps'] },
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
      .values([
        { id: 'day', routineId: 'r', name: '', orderIndex: 0, userProgramId: UP },
        { id: 'twin', routineId: 'r', name: '', orderIndex: 1, userProgramId: UP },
        { id: 'holds-it', routineId: 'r', name: '', orderIndex: 2, userProgramId: UP },
      ])
      .run();
    db.insert(workoutDayExercises)
      .values([
        {
          id: SLOT,
          workoutDayId: 'day',
          exerciseId: 'back-extension',
          orderIndex: 0,
          defaultRestSeconds: 90,
          userProgramId: UP,
        },
        {
          id: 'slot-twin',
          workoutDayId: 'twin',
          exerciseId: 'back-extension',
          orderIndex: 0,
          defaultRestSeconds: 90,
          userProgramId: UP,
        },
        {
          id: 'slot-holds-old',
          workoutDayId: 'holds-it',
          exerciseId: 'back-extension',
          orderIndex: 0,
          defaultRestSeconds: 90,
          userProgramId: UP,
        },
        {
          id: 'slot-holds-new',
          workoutDayId: 'holds-it',
          exerciseId: 'deadlift',
          orderIndex: 1,
          defaultRestSeconds: 180,
          userProgramId: UP,
        },
      ])
      .run();
    db.insert(weekConfigs)
      .values({
        id: 'wk',
        workoutDayExerciseId: SLOT,
        weekNumber: 1,
        sets: 3,
        reps: 12,
        restSeconds: 75,
        intensityType: 'rir',
        userProgramId: UP,
      })
      .run();
  });

  const start = () => startWorkout(U, UP, 'day', 1);

  it("a swap for today runs at the new exercise's rest, and swapping back restores the plan's", () => {
    const log = start();
    expect(snapshotOf(log.id)[0].restSeconds).toBe(75);
    swap(log.id, 'deadlift', { kind: 'session' });
    expect(snapshotOf(log.id)[0].restSeconds).toBe(180);
    swap(log.id, 'back-extension', { kind: 'session' });
    expect(snapshotOf(log.id)[0].restSeconds).toBe(75);
  });

  it("prefers the lifter's own default for the exercise", () => {
    db.insert(exerciseSettings)
      .values({ id: 's', userId: U, exerciseId: 'deadlift', restSeconds: 240 })
      .run();
    const log = start();
    swap(log.id, 'deadlift', { kind: 'session' });
    expect(snapshotOf(log.id)[0].restSeconds).toBe(240);
  });

  it('a rest-of-cycle swap rewrites the slot default and drops the week override', () => {
    const log = start();
    swap(log.id, 'deadlift', { kind: 'cycle' });
    expect(slotById(SLOT)).toMatchObject({ exerciseId: 'deadlift', defaultRestSeconds: 180 });
    const [week] = db.select().from(weekConfigs).where(eq(weekConfigs.id, 'wk')).all();
    expect(week.restSeconds).toBeNull();
    expect(snapshotOf(startWorkout(U, UP, 'day', 1).id)[0].restSeconds).toBe(180);
  });

  it('leaves a week with no rest override unstamped, so sync has nothing to push for it', () => {
    const before = new Date(2026, 0, 1);
    db.insert(weekConfigs)
      .values({
        id: 'wk2',
        workoutDayExerciseId: SLOT,
        weekNumber: 2,
        sets: 3,
        reps: 12,
        intensityType: 'rir',
        userProgramId: UP,
        updatedAt: before,
      })
      .run();
    swap(start().id, 'deadlift', { kind: 'cycle' });
    const [week2] = db.select().from(weekConfigs).where(eq(weekConfigs.id, 'wk2')).all();
    expect(week2.updatedAt).toEqual(before);
  });

  it("a countdown swap opens later sessions at the swapped exercise's rest", () => {
    const log = start();
    swap(log.id, 'deadlift', { kind: 'sessions', count: 2 });
    expect(snapshotOf(startWorkout(U, UP, 'day', 1).id)[0]).toMatchObject({
      exerciseId: 'deadlift',
      restSeconds: 180,
    });
  });

  it('never plants a second copy on a twin split that already plans the exercise', () => {
    const log = start();
    swap(log.id, 'deadlift', { kind: 'cycle' });
    expect(slotById('slot-twin').exerciseId).toBe('deadlift');
    expect(slotById('slot-holds-old').exerciseId).toBe('back-extension');
  });

  it('marks one exercise missed without touching the others', () => {
    const log = start();
    db.update(workoutLogs)
      .set({
        plannedSnapshot: [
          ...snapshotOf(log.id),
          { ...snapshotOf(log.id)[0], slotId: 'other', exerciseId: 'curl' },
        ],
      })
      .where(eq(workoutLogs.id, log.id))
      .run();
    logSet({ workoutLogId: log.id, exerciseId: 'back-extension', weightKg: 20, reps: 12 });
    markRemainingSkipped(log.id, SLOT);
    const [first, second] = snapshotOf(log.id);
    expect(first.skippedSets).toEqual([1, 2]);
    expect(second.skippedSets).toBeUndefined();
  });

  it('adds an exercise with a single set at its own rest, today only or kept', () => {
    const log = start();
    const today = addSessionExercise({
      logId: log.id,
      userId: U,
      exerciseId: 'deadlift',
      keep: false,
      locale: 'en',
    });
    expect(today?.setGroups).toEqual([{ sets: 1, reps: 8, rirMin: 2, rirMax: 2 }]);
    expect(today?.restSeconds).toBe(180);

    const kept = addSessionExercise({
      logId: log.id,
      userId: U,
      exerciseId: 'curl',
      keep: true,
      locale: 'en',
    });
    expect(kept?.setGroups[0].sets).toBe(1);
    expect(kept?.restSeconds).toBe(120);
    expect(slotById(kept!.slotId).defaultRestSeconds).toBe(120);
  });

  it('a past session keeps its saved length and its records when read again', () => {
    const log = start();
    logSet({ workoutLogId: log.id, exerciseId: 'back-extension', weightKg: 20, reps: 12 });
    finishWorkout(log.id);
    db.update(workoutLogs).set({ durationSeconds: 3000 }).where(eq(workoutLogs.id, log.id)).run();

    const summary = sessionSummary(log.id);
    expect(summary.durationSeconds).toBe(3000);
    expect(summary.exercises[0].isPr).toBe(true);
  });
});
