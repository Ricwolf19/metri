import { beforeEach, describe, expect, it, vi } from 'vitest';

import { exercises, setLogs, users, workoutLogs, type WorkoutStatus } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { previousSessionSets } = await import('./session.repo');

const EXERCISE = 'bench';

const log = (id: string, status: WorkoutStatus, completedAt: number, workoutDayId = 'day-a') =>
  db
    .insert(workoutLogs)
    .values({
      id,
      userId: 'u1',
      userProgramId: 'up1',
      workoutDayId,
      weekNumber: 1,
      status,
      startedAt: new Date(completedAt - 3_600_000),
      completedAt: status === 'completed' ? new Date(completedAt) : null,
    })
    .run();

const set = (input: {
  id: string;
  logId: string;
  weightKg: number;
  reps: number;
  setNumber: number;
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
    })
    .run();

describe('previousSessionSets', () => {
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
    expect(previousSessionSets(EXERCISE)).toBeNull();
  });

  it('picks the newest completed session of the exercise, whatever split it was in', () => {
    log('old', 'completed', 1_000, 'day-a');
    log('new', 'completed', 2_000, 'day-b');
    set({ id: 's1', logId: 'old', weightKg: 100, reps: 5, setNumber: 1 });
    set({ id: 's2', logId: 'new', weightKg: 80, reps: 10, setNumber: 1 });
    set({ id: 's3', logId: 'new', weightKg: 75, reps: 12, setNumber: 2 });

    const previous = previousSessionSets(EXERCISE);
    expect(previous?.logId).toBe('new');
    expect(previous?.finishedAt.getTime()).toBe(2_000);
    expect(previous?.sets.map((s) => [s.weightKg, s.reps])).toEqual([
      [80, 10],
      [75, 12],
    ]);
  });

  it('ignores the open session, however recent, and leaves warm-ups out of the ordinals', () => {
    log('done', 'completed', 1_000);
    log('open', 'in_progress', 2_000);
    set({ id: 'w', logId: 'done', weightKg: 40, reps: 8, setNumber: 1, isWarmup: true });
    set({ id: 's1', logId: 'done', weightKg: 80, reps: 10, setNumber: 2 });
    set({ id: 's2', logId: 'done', weightKg: 77.5, reps: 9, setNumber: 3 });
    set({ id: 's3', logId: 'open', weightKg: 90, reps: 8, setNumber: 1 });

    const previous = previousSessionSets(EXERCISE);
    expect(previous?.logId).toBe('done');
    // Set "1" of the previous session is the first WORKING set.
    expect(previous?.sets.map((s) => s.weightKg)).toEqual([80, 77.5]);
  });

  it('stays on the exercise it was asked about', () => {
    log('l', 'completed', 1_000);
    log('l2', 'completed', 2_000);
    set({ id: 's1', logId: 'l', weightKg: 80, reps: 10, setNumber: 1 });
    db.insert(exercises)
      .values({ id: 'squat', name: 'Squat', category: 'legs', primaryMuscles: [] })
      .run();
    set({ id: 's2', logId: 'l2', weightKg: 140, reps: 5, setNumber: 1, exerciseId: 'squat' });

    expect(previousSessionSets(EXERCISE)?.logId).toBe('l');
    expect(previousSessionSets('squat')?.sets[0]).toMatchObject({ weightKg: 140, reps: 5 });
  });
});
