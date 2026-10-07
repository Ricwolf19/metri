import { beforeEach, describe, expect, it, vi } from 'vitest';

import { exercises, setLogs, users, workoutLogs, type WorkoutStatus } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { lastLoggedSet } = await import('./session.repo');

const EXERCISE = 'bench';

const log = (id: string, status: WorkoutStatus) =>
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

const set = (input: {
  id: string;
  logId: string;
  weightKg: number;
  reps: number;
  setNumber: number;
  at: number;
  isWarmup?: boolean;
  exerciseId?: string;
}) =>
  db
    .insert(setLogs)
    .values({
      id: input.id,
      workoutLogId: input.logId,
      exerciseId: input.exerciseId ?? EXERCISE,
      setNumber: input.setNumber,
      weightKg: input.weightKg,
      reps: input.reps,
      isWarmup: input.isWarmup ?? false,
      createdAt: new Date(input.at),
    })
    .run();

describe('lastLoggedSet', () => {
  beforeEach(() => {
    db.delete(setLogs).run();
    db.delete(workoutLogs).run();
    db.delete(exercises).run();
    db.delete(users).run();
    db.insert(users).values({ id: 'u1', email: null, authKind: 'local' }).run();
    db.insert(exercises)
      .values({ id: EXERCISE, name: 'Bench press', category: 'chest', primaryMuscles: [] })
      .run();
  });

  it('returns null with no history', () => {
    expect(lastLoggedSet(EXERCISE)).toBeNull();
  });

  it('picks the newest working set across completed sessions, not the heaviest', () => {
    log('old', 'completed');
    log('new', 'completed');
    set({ id: 's1', logId: 'old', weightKg: 100, reps: 5, setNumber: 1, at: 1_000 });
    set({ id: 's2', logId: 'new', weightKg: 80, reps: 10, setNumber: 1, at: 2_000 });
    set({ id: 's3', logId: 'new', weightKg: 75, reps: 12, setNumber: 2, at: 3_000 });

    expect(lastLoggedSet(EXERCISE)).toMatchObject({ weightKg: 75, reps: 12 });
  });

  it('ignores the open session and warm-ups, however recent', () => {
    log('done', 'completed');
    log('open', 'in_progress');
    set({ id: 's1', logId: 'done', weightKg: 80, reps: 10, setNumber: 1, at: 1_000 });
    set({ id: 's2', logId: 'open', weightKg: 90, reps: 8, setNumber: 1, at: 2_000 });
    set({
      id: 's3',
      logId: 'done',
      weightKg: 40,
      reps: 8,
      setNumber: 2,
      at: 3_000,
      isWarmup: true,
    });

    expect(lastLoggedSet(EXERCISE)).toMatchObject({ weightKg: 80, reps: 10 });
  });

  it('breaks a same-timestamp tie by set number', () => {
    log('l', 'completed');
    set({ id: 's1', logId: 'l', weightKg: 80, reps: 10, setNumber: 1, at: 1_000 });
    set({ id: 's2', logId: 'l', weightKg: 77.5, reps: 11, setNumber: 2, at: 1_000 });

    expect(lastLoggedSet(EXERCISE)).toMatchObject({ weightKg: 77.5, reps: 11 });
  });

  it('stays on the exercise it was asked about', () => {
    log('l', 'completed');
    set({ id: 's1', logId: 'l', weightKg: 80, reps: 10, setNumber: 1, at: 1_000 });
    db.insert(exercises)
      .values({ id: 'squat', name: 'Squat', category: 'legs', primaryMuscles: [] })
      .run();
    set({
      id: 's2',
      logId: 'l',
      weightKg: 140,
      reps: 5,
      setNumber: 1,
      at: 2_000,
      exerciseId: 'squat',
    });

    expect(lastLoggedSet(EXERCISE)).toMatchObject({ weightKg: 80, reps: 10 });
  });
});
