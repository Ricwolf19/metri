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

describe('advanceUserProgram with skipped splits', () => {
  beforeEach(() => {
    for (const t of [workoutLogs, userPrograms, workoutDays, routines, programs])
      db.delete(t).run();
  });

  /** One phase of two weeks with two splits (Mon push, Thu pull). */
  const enrollTwoSplits = () => {
    const program = createCustomProgram(USER, { name: 'Upper/Lower' });
    const phase = addRoutine(program.id, null, { name: 'Base', durationWeeks: 2 });
    const push = addDay(phase.id, null, { name: 'Push' });
    addSlot(push.id, null, 'ex-1');
    const pull = addDay(phase.id, null, { name: 'Pull' });
    addSlot(pull.id, null, 'ex-1');
    return enrollInProgram(USER, program.id, [
      { dayId: push.id, weekday: 2, startMinute: 600 },
      { dayId: pull.id, weekday: 5, startMinute: 600 },
    ]);
  };

  const log = (
    userProgramId: string,
    dayId: string,
    week: number,
    status: 'completed' | 'skipped',
  ) =>
    db
      .insert(workoutLogs)
      .values({
        id: crypto.randomUUID(),
        userId: USER,
        userProgramId,
        workoutDayId: dayId,
        weekNumber: week,
        status,
      })
      .run();

  it('a skipped split resolves the week like a finished one', () => {
    const e = enrollTwoSplits();
    const [push, pull] = currentDays(e.id, e.currentRoutineId!);
    log(e.id, push.id, 1, 'completed');
    log(e.id, pull.id, 1, 'skipped');
    advanceUserProgram(e.id);
    expect(reload(e.id).currentWeek).toBe(2);
  });

  it('a skip alone does not resolve a week with another split still open', () => {
    const e = enrollTwoSplits();
    const [push] = currentDays(e.id, e.currentRoutineId!);
    log(e.id, push.id, 1, 'skipped');
    advanceUserProgram(e.id);
    expect(reload(e.id).currentWeek).toBe(1);
  });
});

describe('enrollInProgram copies the RM-test week', () => {
  beforeEach(() => {
    for (const t of [workoutLogs, userPrograms, workoutDays, routines, programs])
      db.delete(t).run();
  });

  it('keeps the template routine flag on the enrolled copy', () => {
    const program = createCustomProgram(USER, { name: 'Peak' });
    const phase = addRoutine(program.id, null, { name: 'Block', durationWeeks: 4 });
    const day = addDay(phase.id, null, { name: 'Heavy' });
    addSlot(day.id, null, 'ex-1');
    db.update(routines).set({ rmTestWeek: 4 }).where(eq(routines.id, phase.id)).run();

    const e = enrollInProgram(USER, program.id, [{ dayId: day.id, weekday: 2, startMinute: 600 }]);
    const [copy] = db.select().from(routines).where(eq(routines.id, e.currentRoutineId!)).all();
    expect(copy.rmTestWeek).toBe(4);
  });
});
