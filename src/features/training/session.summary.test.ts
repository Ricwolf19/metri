import { beforeEach, describe, expect, it, vi } from 'vitest';

import { exercises, setLogs, users, workoutLogs } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { sessionSummary } = await import('./session.repo');

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
