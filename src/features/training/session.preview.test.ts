import { beforeEach, describe, expect, it, vi } from 'vitest';

import { exercises, routines, weekConfigs, workoutDayExercises, workoutDays } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { splitPreview } = await import('./session.repo');

describe('splitPreview', () => {
  beforeEach(() => {
    for (const t of [weekConfigs, workoutDayExercises, workoutDays, routines, exercises])
      db.delete(t).run();
    db.insert(exercises)
      .values([
        { id: 'bench', name: 'Bench Press', category: 'chest', primaryMuscles: ['chest'] },
        { id: 'fly', name: 'Fly', category: 'chest', primaryMuscles: ['chest'] },
      ])
      .run();
    db.insert(routines).values({ id: 'r', programId: 'p', name: '', orderIndex: 0 }).run();
    db.insert(workoutDays).values({ id: 'd', routineId: 'r', name: '', orderIndex: 0 }).run();
    db.insert(workoutDayExercises)
      .values([
        {
          id: 's-bench',
          workoutDayId: 'd',
          exerciseId: 'bench',
          orderIndex: 0,
          defaultRestSeconds: 180,
          badges: ['Pausa', 'Similar al dibujo'],
        },
        { id: 's-fly', workoutDayId: 'd', exerciseId: 'fly', orderIndex: 1 },
      ])
      .run();
    db.insert(weekConfigs)
      .values([
        {
          id: 'w1',
          workoutDayExerciseId: 's-bench',
          weekNumber: 1,
          sets: 3,
          reps: 6,
          repsMax: 8,
          rirMin: 1,
          rirMax: 2,
        },
        {
          id: 'w2',
          workoutDayExerciseId: 's-bench',
          weekNumber: 2,
          sets: 1,
          reps: 8,
          setGroups: [
            { sets: 1, reps: 6, toFailure: true },
            { sets: 2, reps: 8, rirMin: 2, rirMax: 2 },
          ],
          restSeconds: 240,
        },
      ])
      .run();
  });

  it('reads the week the lifter picked, with its effort, rest and cues', () => {
    const [bench, fly] = splitPreview('d', 1, 'en');
    expect(bench).toEqual({
      exerciseId: 'bench',
      name: 'Bench Press',
      groups: [{ sets: 3, reps: 6, repsMax: 8, rirMin: 1, rirMax: 2 }],
      restSeconds: 180,
      // A retired cue never reaches the preview.
      badges: ['Pausa'],
    });
    // No prescription that week: the session's default, and the slot's rest.
    expect(fly.groups).toEqual([{ sets: 3, reps: 8 }]);
    expect(fly.restSeconds).toBe(120);
  });

  it('another week brings its own groups and its rest override', () => {
    const [bench] = splitPreview('d', 2, 'en');
    expect(bench.groups).toHaveLength(2);
    expect(bench.groups[0]).toMatchObject({ toFailure: true });
    expect(bench.restSeconds).toBe(240);
  });
});
