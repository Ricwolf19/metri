import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { programs, routines, userPrograms, workoutDays, workoutLogs } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { addDay, addRoutine, addSlot, createCustomProgram } = await import('./authoring.repo');
const { advanceUserProgram, enrollInProgram } = await import('./enroll');

const USER = 'u-1';

/** Two phases: Base (2 weeks, Mon) then Peak (1 week, Fri). */
const enrollTwoPhases = () => {
  const program = createCustomProgram(USER, { name: 'PPL' });
  const base = addRoutine(program.id, null, { name: 'Base', durationWeeks: 2 });
  const baseDay = addDay(base.id, null, { name: 'Push' });
  addSlot(baseDay.id, null, 'ex-1');
  const peak = addRoutine(program.id, null, { name: 'Peak', durationWeeks: 1 });
  const peakDay = addDay(peak.id, null, { name: 'Full' });
  addSlot(peakDay.id, null, 'ex-1');
  const enrollment = enrollInProgram(USER, program.id, [
    { dayId: baseDay.id, weekday: 2, startMinute: 600 },
    { dayId: peakDay.id, weekday: 6, startMinute: 600 },
  ]);
  return enrollment;
};

const currentDays = (userProgramId: string, routineId: string) =>
  db
    .select()
    .from(workoutDays)
    .where(eq(workoutDays.routineId, routineId))
    .all()
    .filter((d) => d.userProgramId === userProgramId);

const completeWeek = (userProgramId: string, routineId: string, week: number) => {
  for (const day of currentDays(userProgramId, routineId)) {
    db.insert(workoutLogs)
      .values({
        id: crypto.randomUUID(),
        userId: USER,
        userProgramId,
        workoutDayId: day.id,
        weekNumber: week,
        status: 'completed',
      })
      .run();
  }
};

const reload = (id: string) =>
  db.select().from(userPrograms).where(eq(userPrograms.id, id)).all()[0];

describe('advanceUserProgram', () => {
  beforeEach(() => {
    for (const t of [workoutLogs, userPrograms, workoutDays, routines, programs])
      db.delete(t).run();
  });

  it('stays put while the week is unfinished', () => {
    const e = enrollTwoPhases();
    advanceUserProgram(e.id);
    expect(reload(e.id)).toMatchObject({ currentWeek: 1, currentRoutineId: e.currentRoutineId });
  });

  it('moves to the next week, then to the next phase with weekdays re-derived, then completes', () => {
    const e = enrollTwoPhases();
    const base = e.currentRoutineId!;
    expect(e.trainingWeekdays).toEqual([2]);

    completeWeek(e.id, base, 1);
    advanceUserProgram(e.id);
    expect(reload(e.id)).toMatchObject({ currentWeek: 2, currentRoutineId: base });

    completeWeek(e.id, base, 2);
    advanceUserProgram(e.id);
    const atPeak = reload(e.id);
    expect(atPeak.currentRoutineId).not.toBe(base);
    expect(atPeak.currentWeek).toBe(1);
    // The plan's rhythm follows the new phase's splits (Fri), not the old one.
    expect(atPeak.trainingWeekdays).toEqual([6]);

    completeWeek(e.id, atPeak.currentRoutineId!, 1);
    advanceUserProgram(e.id);
    expect(reload(e.id).status).toBe('completed');
  });
});
