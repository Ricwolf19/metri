import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { programs, routines, userPrograms, workoutDays } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { addDay, addRoutine, addSlot, createCustomProgram, deleteProgramTree, reorderRoutines } =
  await import('./authoring.repo');
const { StartValidationError, enrollInProgram } = await import('./enroll');

const USER = 'u-1';

const buildProgram = () => {
  const program = createCustomProgram(USER, { name: 'PPL' });
  const phase = addRoutine(program.id, null, { name: 'Base', durationWeeks: 2 });
  const push = addDay(phase.id, null, { name: 'Push' });
  return { program, phase, push };
};

describe('start validation + enrollment copy', () => {
  beforeEach(() => {
    for (const table of [userPrograms, workoutDays, routines, programs]) db.delete(table).run();
  });

  it('refuses a split with no exercises', () => {
    const { program, push } = buildProgram();
    expect(() =>
      enrollInProgram(USER, program.id, [{ dayId: push.id, weekday: 2, startMinute: 1080 }]),
    ).toThrow(StartValidationError);
  });

  it('refuses an incomplete schedule', () => {
    const { program, push } = buildProgram();
    addSlot(push.id, null, 'ex-1');
    expect(() => enrollInProgram(USER, program.id, [])).toThrow(/Schedule/);
  });

  it('copies the tree, stamps the schedule on the copy only, derives training weekdays', () => {
    const { program, push } = buildProgram();
    addSlot(push.id, null, 'ex-1');

    const enrollment = enrollInProgram(USER, program.id, [
      { dayId: push.id, weekday: 2, startMinute: 1080 },
    ]);

    const copied = db
      .select()
      .from(workoutDays)
      .where(eq(workoutDays.userProgramId, enrollment.id))
      .all();
    expect(copied).toHaveLength(1);
    expect(copied[0].weekday).toBe(2);
    expect(copied[0].startMinute).toBe(1080);
    const template = db.select().from(workoutDays).where(eq(workoutDays.id, push.id)).all()[0];
    expect(template.weekday).toBeNull();
    expect(enrollment.trainingWeekdays).toEqual([2]);
  });

  it('blocks deleting a template while an enrollment is active, and never touches the copy', () => {
    const { program, push } = buildProgram();
    addSlot(push.id, null, 'ex-1');
    const enrollment = enrollInProgram(USER, program.id, [
      { dayId: push.id, weekday: 2, startMinute: 1080 },
    ]);

    expect(deleteProgramTree(program.id)).toBe(false);

    db.update(userPrograms)
      .set({ status: 'abandoned' })
      .where(eq(userPrograms.id, enrollment.id))
      .run();
    expect(deleteProgramTree(program.id)).toBe(true);
    // Template rows gone, the (abandoned) copy's rows untouched by this call.
    expect(
      db.select().from(routines).where(eq(routines.userProgramId, enrollment.id)).all(),
    ).toHaveLength(1);
    expect(db.select().from(programs).all()).toHaveLength(0);
  });

  it('reorders only the scoped tree', () => {
    const { program, phase } = buildProgram();
    const second = addRoutine(program.id, null, { name: 'Peak' });
    reorderRoutines(program.id, null, [second.id, phase.id]);
    const ordered = db
      .select({ id: routines.id, orderIndex: routines.orderIndex })
      .from(routines)
      .where(eq(routines.programId, program.id))
      .all()
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((r) => r.id);
    expect(ordered).toEqual([second.id, phase.id]);
  });
});
