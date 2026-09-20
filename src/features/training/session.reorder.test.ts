import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { users, workoutLogs, type PlannedSlot } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { reorderSnapshot } = await import('./session.repo');

const slot = (slotId: string): PlannedSlot => ({
  slotId,
  exerciseId: `ex-${slotId}`,
  name: slotId,
  setGroups: [{ sets: 3, reps: 8 }],
  restSeconds: 120,
  badges: [],
  alternativeExerciseIds: [],
});

const snapshotOf = (logId: string) =>
  db.select().from(workoutLogs).where(eq(workoutLogs.id, logId)).all()[0]?.plannedSnapshot;

describe('reorderSnapshot', () => {
  beforeEach(() => {
    db.delete(workoutLogs).run();
    db.delete(users).run();
    db.insert(users).values({ id: 'u1', email: null, authKind: 'local' }).run();
    db.insert(workoutLogs)
      .values({
        id: 'log',
        userId: 'u1',
        userProgramId: 'up1',
        workoutDayId: 'd1',
        weekNumber: 1,
        status: 'in_progress',
        startedAt: new Date(),
        plannedSnapshot: [slot('a'), slot('b'), slot('c')],
      })
      .run();
  });

  it('persists the new order with every slot intact', () => {
    reorderSnapshot('log', ['c', 'a', 'b']);
    expect(snapshotOf('log')?.map((p) => p.slotId)).toEqual(['c', 'a', 'b']);
  });

  it('ignores an order that drops or invents slots — never lose a slot', () => {
    reorderSnapshot('log', ['c', 'a']);
    reorderSnapshot('log', ['c', 'a', 'b', 'ghost']);
    expect(snapshotOf('log')?.map((p) => p.slotId)).toEqual(['a', 'b', 'c']);
  });
});
