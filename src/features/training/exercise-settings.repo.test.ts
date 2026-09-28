import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';

import {
  exerciseSettings,
  exercises,
  programs,
  routines,
  userPrograms,
  users,
  workoutDayExercises,
  workoutDays,
  workoutLogs,
} from '@/db/schema';
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
    for (const table of [
      exerciseSettings,
      workoutLogs,
      workoutDayExercises,
      userPrograms,
      workoutDays,
      routines,
      programs,
      exercises,
      users,
    ]) {
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

  it('propagates badge/rest edits into enrolled slots and the active session snapshot', () => {
    db.insert(programs).values({ id: 'p2', name: 'P2', isCustom: true, userId: U }).run();
    db.insert(routines).values({ id: 'r2', programId: 'p2', name: '', orderIndex: 0 }).run();
    db.insert(workoutDays).values({ id: 'd2', routineId: 'r2', name: '', orderIndex: 0 }).run();
    db.insert(userPrograms)
      .values({ id: 'up1', userId: U, programId: 'p2', status: 'active' })
      .run();
    db.insert(workoutDayExercises)
      .values({
        id: 'slot1',
        workoutDayId: 'd2',
        exerciseId: 'deadlift',
        orderIndex: 1,
        userProgramId: 'up1',
      })
      .run();
    // A template-scoped slot must NOT be touched.
    db.insert(workoutDayExercises)
      .values({ id: 'slotT', workoutDayId: 'd2', exerciseId: 'deadlift', orderIndex: 2 })
      .run();
    db.insert(workoutLogs)
      .values({
        id: 'log1',
        userId: U,
        userProgramId: 'up1',
        workoutDayId: 'd2',
        weekNumber: 1,
        status: 'in_progress',
        plannedSnapshot: [
          {
            slotId: 'slot1',
            exerciseId: 'deadlift',
            name: 'Deadlift',
            setGroups: [{ sets: 3, reps: 8 }],
            restSeconds: 120,
            badges: [],
            alternativeExerciseIds: [],
            notes: null,
          },
        ],
      })
      .run();

    upsertExerciseSetting(U, 'deadlift', { restSeconds: 210, badges: ['PAUSA LARGA'] });

    const [slot] = db
      .select()
      .from(workoutDayExercises)
      .where(eq(workoutDayExercises.id, 'slot1'))
      .all();
    expect(slot.defaultRestSeconds).toBe(210);
    expect(slot.badges).toEqual(['PAUSA LARGA']);

    const [template] = db
      .select()
      .from(workoutDayExercises)
      .where(eq(workoutDayExercises.id, 'slotT'))
      .all();
    expect(template.badges).toBeNull();

    const [log] = db.select().from(workoutLogs).where(eq(workoutLogs.id, 'log1')).all();
    expect(log.plannedSnapshot?.[0]).toMatchObject({
      badges: ['PAUSA LARGA'],
      restSeconds: 210,
    });
  });
});
