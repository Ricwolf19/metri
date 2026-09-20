import { beforeEach, describe, expect, it, vi } from 'vitest';

import { exerciseSettings, exercises, programs, routines, users, workoutDays } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { getExerciseSetting, upsertExerciseSetting } = await import('./exercise-settings.repo');
const { addSlot } = await import('./authoring.repo');
const { deleteCustomExercise } = await import('./exercises.repo');

const U = 'u1';

describe('exercise settings', () => {
  beforeEach(() => {
    for (const table of [exerciseSettings, workoutDays, routines, programs, exercises, users]) {
      db.delete(table).run();
    }
    db.insert(users).values({ id: U, email: null, authKind: 'local' }).run();
    db.insert(exercises)
      .values({ id: 'deadlift', name: 'Deadlift', category: 'back', isCustom: false })
      .run();
  });

  it('upserts one row per (user, exercise)', () => {
    upsertExerciseSetting(U, 'deadlift', { restSeconds: 180 });
    upsertExerciseSetting(U, 'deadlift', { badges: ['CON PAUSA'] });

    const setting = getExerciseSetting(U, 'deadlift');
    expect(setting?.restSeconds).toBe(180);
    expect(setting?.badges).toEqual(['CON PAUSA']);
  });

  it('seeds a new slot with the owner defaults', () => {
    db.insert(programs).values({ id: 'p', name: 'P', isCustom: true, userId: U }).run();
    db.insert(routines).values({ id: 'r', programId: 'p', name: '', orderIndex: 0 }).run();
    db.insert(workoutDays).values({ id: 'd', routineId: 'r', name: '', orderIndex: 0 }).run();
    upsertExerciseSetting(U, 'deadlift', {
      restSeconds: 240,
      badges: ['RESET'],
      alternativeExerciseIds: ['sumo-deadlift'],
    });

    const slot = addSlot('d', null, 'deadlift');

    expect(slot.defaultRestSeconds).toBe(240);
    expect(slot.badges).toEqual(['RESET']);
    expect(slot.alternativeExerciseIds).toEqual(['sumo-deadlift']);
  });

  it('deleting a custom exercise takes its settings with it (no orphan syncs)', () => {
    db.insert(exercises)
      .values({ id: 'mine', name: 'My Move', category: 'core', isCustom: true, userId: U })
      .run();
    upsertExerciseSetting(U, 'mine', { restSeconds: 60 });

    expect(deleteCustomExercise('mine', U)).toBe(true);

    expect(getExerciseSetting(U, 'mine')).toBeNull();
  });

  it('falls back to plain defaults when the user configured nothing', () => {
    db.insert(programs).values({ id: 'p', name: 'P', isCustom: true, userId: U }).run();
    db.insert(routines).values({ id: 'r', programId: 'p', name: '', orderIndex: 0 }).run();
    db.insert(workoutDays).values({ id: 'd', routineId: 'r', name: '', orderIndex: 0 }).run();

    const slot = addSlot('d', null, 'deadlift');

    expect(slot.defaultRestSeconds).toBe(120);
    expect(slot.badges).toBeNull();
  });
});
