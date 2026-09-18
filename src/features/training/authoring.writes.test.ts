import { and, eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  programs,
  routines,
  syncDeletions,
  userPrograms,
  weekConfigs,
  workoutDayExercises,
  workoutDays,
} from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const {
  addDay,
  addRoutine,
  addSlot,
  createCustomProgram,
  saveSlotDraft,
  updateDay,
  updateRoutine,
} = await import('./authoring.repo');
const { enrollInProgram } = await import('./enroll');

const USER = 'u-1';

const build = (weeks = 2) => {
  const program = createCustomProgram(USER, { name: 'PPL' });
  const phase = addRoutine(program.id, null, { name: 'Base', durationWeeks: weeks });
  const day = addDay(phase.id, null, { name: 'Push' });
  const slot = addSlot(day.id, null, 'ex-1');
  return { program, phase, day, slot };
};

const configsOf = (slotId: string) =>
  db
    .select()
    .from(weekConfigs)
    .where(eq(weekConfigs.workoutDayExerciseId, slotId))
    .all()
    .sort((a, b) => a.weekNumber - b.weekNumber);

describe('authoring write paths', () => {
  beforeEach(() => {
    for (const t of [
      syncDeletions,
      weekConfigs,
      workoutDayExercises,
      workoutDays,
      userPrograms,
      routines,
      programs,
    ]) {
      db.delete(t).run();
    }
  });

  it('growing a phase copies the last known week forward', () => {
    const { phase, slot } = build(2);
    saveSlotDraft(slot.id, {
      defaultRestSeconds: 90,
      badges: [],
      weeks: [
        { weekNumber: 1, values: { ...configsOf(slot.id)[0], sets: 4 }, setGroups: null },
        { weekNumber: 2, values: { ...configsOf(slot.id)[1], sets: 5 }, setGroups: null },
      ],
    });

    updateRoutine(phase.id, { durationWeeks: 4 });

    expect(configsOf(slot.id).map((c) => c.sets)).toEqual([4, 5, 5, 5]);
  });

  it('shrinking a phase deletes overflow weeks and tombstones them for sync', () => {
    const { phase, slot } = build(3);
    const overflowIds = configsOf(slot.id)
      .filter((c) => c.weekNumber > 1)
      .map((c) => c.id);

    updateRoutine(phase.id, { durationWeeks: 1 });

    expect(configsOf(slot.id)).toHaveLength(1);
    const tombstones = db
      .select({ rowId: syncDeletions.rowId })
      .from(syncDeletions)
      .where(eq(syncDeletions.tableName, 'week_configs'))
      .all()
      .map((r) => r.rowId)
      .sort();
    expect(tombstones).toEqual([...overflowIds].sort());
  });

  it('saveSlotDraft writes rest, clamped badges and every week in one pass', () => {
    const { slot } = build(2);
    const [w1, w2] = configsOf(slot.id);

    saveSlotDraft(slot.id, {
      defaultRestSeconds: 150,
      badges: ['  no failure ', '', 'b', 'c', 'd', 'e', 'f', 'x'.repeat(40)],
      weeks: [
        { weekNumber: 1, values: { ...w1, reps: 10 }, setGroups: null },
        { weekNumber: 2, values: { ...w2, reps: 12 }, setGroups: [{ sets: 1, reps: 5 }] },
      ],
    });

    const [row] = db
      .select()
      .from(workoutDayExercises)
      .where(eq(workoutDayExercises.id, slot.id))
      .all();
    expect(row.defaultRestSeconds).toBe(150);
    expect(row.badges).toEqual(['no failure', 'b', 'c', 'd', 'e']);
    const after = configsOf(slot.id);
    expect(after.map((c) => c.reps)).toEqual([10, 12]);
    expect(after[1].setGroups).toEqual([{ sets: 1, reps: 5 }]);
  });

  it('rescheduling a live-copy split re-derives the enrollment weekdays', () => {
    const { program, day } = build(1);
    const enrollment = enrollInProgram(USER, program.id, [
      { dayId: day.id, weekday: 2, startMinute: 600 },
    ]);
    const [copy] = db
      .select()
      .from(workoutDays)
      .where(and(eq(workoutDays.userProgramId, enrollment.id)))
      .all();

    updateDay(copy.id, { weekday: 5, startMinute: 420 });

    const [row] = db.select().from(userPrograms).where(eq(userPrograms.id, enrollment.id)).all();
    expect(row.trainingWeekdays).toEqual([5]);
    // The template split is untouched.
    expect(
      db.select().from(workoutDays).where(eq(workoutDays.id, day.id)).all()[0].weekday,
    ).toBeNull();
  });
});
