import { asc, eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setLogs, users, workoutLogs } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { deleteSet, logSet, previousSessionSets, updateSet } = await import('./session.repo');

const U = 'u-1';
const LOG = 'log-1';

const numbers = () =>
  db
    .select({ n: setLogs.setNumber, w: setLogs.weightKg })
    .from(setLogs)
    .where(eq(setLogs.workoutLogId, LOG))
    .orderBy(asc(setLogs.createdAt), asc(setLogs.setNumber))
    .all();

describe('correcting and deleting logged sets', () => {
  beforeEach(() => {
    for (const t of [setLogs, workoutLogs, users]) db.delete(t).run();
    db.insert(users).values({ id: U, email: null, authKind: 'local' }).run();
    db.insert(workoutLogs)
      .values({
        id: LOG,
        userId: U,
        userProgramId: 'up',
        workoutDayId: 'day',
        weekNumber: 1,
        status: 'completed',
        startedAt: new Date('2026-10-01T10:00:00Z'),
        completedAt: new Date('2026-10-01T11:00:00Z'),
      })
      .run();
    for (const w of [80, 82.5, 85, 85])
      logSet({ workoutLogId: LOG, exerciseId: 'bench', weightKg: w, reps: 8 });
  });

  it('updateSet rewrites the numbers in place and keeps the ordinal', () => {
    const [, second] = db.select().from(setLogs).orderBy(asc(setLogs.setNumber)).all();
    updateSet(second.id, {
      weightKg: 90,
      reps: 6,
      load: { kind: 'barbell', barKg: 20, platesKg: [25, 10] },
      rir: 1,
      isFailure: false,
    });
    const [row] = db.select().from(setLogs).where(eq(setLogs.id, second.id)).all();
    expect(row).toMatchObject({ setNumber: 2, weightKg: 90, reps: 6, rir: 1 });
    expect(row.load).toEqual({ kind: 'barbell', barKg: 20, platesKg: [25, 10] });
    expect(row.updatedAt).not.toBeNull();
  });

  it('deleteSet of a middle set closes the gap so no ordinal repeats', () => {
    const [, second] = db.select().from(setLogs).orderBy(asc(setLogs.setNumber)).all();
    deleteSet(second.id);
    expect(numbers()).toEqual([
      { n: 1, w: 80 },
      { n: 2, w: 85 },
      { n: 3, w: 85 },
    ]);
    // The next set logged continues the sequence instead of repeating 4.
    logSet({ workoutLogId: LOG, exerciseId: 'bench', weightKg: 87.5, reps: 8 });
    expect(numbers().map((r) => r.n)).toEqual([1, 2, 3, 4]);
  });

  it('the previous-session ordinals follow the renumbering', () => {
    const [first] = db.select().from(setLogs).orderBy(asc(setLogs.setNumber)).all();
    deleteSet(first.id);
    expect(previousSessionSets('bench')?.sets.map((s) => s.weightKg)).toEqual([82.5, 85, 85]);
  });
});
