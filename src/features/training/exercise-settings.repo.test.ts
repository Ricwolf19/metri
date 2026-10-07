import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';

import {
  exerciseNotes,
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
      exerciseNotes,
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

  it('stores the last load config without touching any slot', () => {
    db.insert(programs).values({ id: 'p', name: 'P', isCustom: true, userId: U }).run();
    db.insert(routines).values({ id: 'r', programId: 'p', name: '', orderIndex: 0 }).run();
    db.insert(workoutDays).values({ id: 'd', routineId: 'r', name: '', orderIndex: 0 }).run();
    db.insert(userPrograms).values({ id: 'up', userId: U, programId: 'p', status: 'active' }).run();
    db.insert(workoutDayExercises)
      .values({
        id: 'slot',
        workoutDayId: 'd',
        exerciseId: 'deadlift',
        orderIndex: 1,
        userProgramId: 'up',
        defaultRestSeconds: 120,
      })
      .run();
    const load = { kind: 'barbell' as const, barKg: 20, platesKg: [20, 10] };
    const slotRow = () =>
      db.select().from(workoutDayExercises).where(eq(workoutDayExercises.id, 'slot')).all()[0];
    const before = slotRow();

    upsertExerciseSetting(U, 'deadlift', { load });

    expect(getExerciseSetting(U, 'deadlift')?.load).toEqual(load);
    expect(slotRow()).toEqual(before);
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

  it('deleting a custom exercise takes its note with it (no orphan rows)', () => {
    db.insert(exercises)
      .values({ id: 'mine', name: 'My Move', category: 'core', isCustom: true, userId: U })
      .run();
    db.insert(exerciseNotes)
      .values([
        { id: 'n1', userId: U, exerciseId: 'mine', note: 'slow eccentric' },
        { id: 'n2', userId: U, exerciseId: 'deadlift', note: 'straps' },
      ])
      .run();

    expect(deleteCustomExercise('mine', U)).toBe(true);

    expect(db.select({ id: exerciseNotes.id }).from(exerciseNotes).all()).toEqual([{ id: 'n2' }]);
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

  it('moves only active-enrollment slots that still hold the previous default', () => {
    db.insert(programs).values({ id: 'p3', name: 'P3', isCustom: true, userId: U }).run();
    db.insert(routines).values({ id: 'r3', programId: 'p3', name: '', orderIndex: 0 }).run();
    db.insert(workoutDays).values({ id: 'd3', routineId: 'r3', name: '', orderIndex: 0 }).run();
    db.insert(userPrograms)
      .values([
        { id: 'active', userId: U, programId: 'p3', status: 'active' },
        { id: 'done', userId: U, programId: 'p3', status: 'completed' },
      ])
      .run();
    upsertExerciseSetting(U, 'deadlift', { restSeconds: 180 });
    const stamp = new Date(1_000);
    db.insert(workoutDayExercises)
      .values([
        // Still on the old default → follows the new one.
        { id: 'match', workoutDayId: 'd3', exerciseId: 'deadlift', userProgramId: 'active' },
        // Customised away from the old default → the lifter's choice stands.
        { id: 'custom', workoutDayId: 'd3', exerciseId: 'deadlift', userProgramId: 'active' },
        // A finished program is history.
        { id: 'finished', workoutDayId: 'd3', exerciseId: 'deadlift', userProgramId: 'done' },
      ])
      .run();
    db.update(workoutDayExercises).set({ defaultRestSeconds: 180, updatedAt: stamp }).run();
    db.update(workoutDayExercises)
      .set({ defaultRestSeconds: 75 })
      .where(eq(workoutDayExercises.id, 'custom'))
      .run();

    upsertExerciseSetting(U, 'deadlift', { restSeconds: 240 });

    const slot = (id: string) =>
      db.select().from(workoutDayExercises).where(eq(workoutDayExercises.id, id)).all()[0];
    expect(slot('match').defaultRestSeconds).toBe(240);
    expect(slot('match').updatedAt.getTime()).not.toBe(stamp.getTime());
    expect(slot('custom').defaultRestSeconds).toBe(75);
    expect(slot('custom').updatedAt.getTime()).toBe(stamp.getTime());
    expect(slot('finished').defaultRestSeconds).toBe(180);
    expect(slot('finished').updatedAt.getTime()).toBe(stamp.getTime());
  });
});
