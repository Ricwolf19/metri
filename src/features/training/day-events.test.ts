import { beforeEach, describe, expect, it, vi } from 'vitest';

import { exercises, setLogs, users, workoutDays, workoutLogs } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { getDayDetail } = await import('./day-events');

const USER = 'u-1';
const DAY = '2026-09-16';

const logAt = (id: string, completedAt: Date) =>
  db
    .insert(workoutLogs)
    .values({
      id,
      userId: USER,
      userProgramId: 'up',
      workoutDayId: 'd-push',
      weekNumber: 1,
      status: 'completed',
      completedAt,
    })
    .run();

const set = (
  logId: string,
  exerciseId: string,
  n: number,
  weightKg: number,
  reps: number,
  isWarmup = false,
) =>
  db
    .insert(setLogs)
    .values({
      id: crypto.randomUUID(),
      workoutLogId: logId,
      exerciseId,
      setNumber: n,
      weightKg,
      reps,
      isWarmup,
      rir: 2,
    })
    .run();

describe('getDayDetail', () => {
  beforeEach(() => {
    for (const t of [setLogs, workoutLogs, workoutDays, exercises, users]) db.delete(t).run();
    db.insert(users).values({ id: USER, authKind: 'local', displayName: 'Ric' }).run();
    db.insert(workoutDays).values({ id: 'd-push', routineId: 'r', name: 'Push' }).run();
    db.insert(exercises)
      .values([
        { id: 'bench', name: 'Bench', category: 'chest' },
        { id: 'fly', name: 'Fly', category: 'chest' },
      ])
      .run();
  });

  it('groups working sets by exercise in logging order and excludes warm-ups', () => {
    logAt('w1', new Date(2026, 8, 16, 12, 0));
    set('w1', 'bench', 1, 40, 10, true);
    set('w1', 'bench', 2, 80, 8);
    set('w1', 'fly', 1, 20, 12);
    set('w1', 'bench', 3, 80, 8);

    const [w] = getDayDetail(USER, DAY).workouts;
    expect(w.dayName).toBe('Push');
    expect(w.setCount).toBe(3);
    expect(w.volumeKg).toBe(80 * 8 * 2 + 20 * 12);
    expect(w.exercises.map((e) => e.name)).toEqual(['Bench', 'Fly']);
    expect(w.exercises[0].sets.map((s) => s.reps)).toEqual([8, 8]);
  });

  it('only counts logs completed within the local day', () => {
    logAt('late', new Date(2026, 8, 16, 23, 59));
    logAt('next', new Date(2026, 8, 17, 0, 1));
    expect(getDayDetail(USER, DAY).workouts.map((w) => w.logId)).toEqual(['late']);
    expect(getDayDetail(USER, DAY).tdeeComputed).toBe(false);
  });
});
