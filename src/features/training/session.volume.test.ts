import { beforeEach, describe, expect, it, vi } from 'vitest';

import { exercises, setLogs, users, workoutLogs } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { programSessionsQuery, sessionSummary } = await import('./session.repo');

describe('session volume with load details', () => {
  beforeEach(() => {
    db.delete(setLogs).run();
    db.delete(workoutLogs).run();
    db.delete(exercises).run();
    db.delete(users).run();
    db.insert(users).values({ id: 'u1', email: null, authKind: 'local' }).run();
    db.insert(exercises)
      .values({ id: 'db-press', name: 'DB press', category: 'chest', primaryMuscles: [] })
      .run();
    db.insert(workoutLogs)
      .values({
        id: 'l1',
        userId: 'u1',
        userProgramId: 'up1',
        workoutDayId: 'day-a',
        weekNumber: 1,
        status: 'completed',
        completedAt: new Date(),
      })
      .run();
    db.insert(setLogs)
      .values([
        // Two 30 kg dumbbells: the row says 30, the body moved 60.
        {
          id: 's1',
          workoutLogId: 'l1',
          exerciseId: 'db-press',
          setNumber: 1,
          weightKg: 30,
          reps: 10,
          load: { kind: 'dumbbell', perHandKg: 30, hands: 2 },
        },
        // A plain row (pre-upgrade, or typed): the number is the total.
        {
          id: 's2',
          workoutLogId: 'l1',
          exerciseId: 'db-press',
          setNumber: 2,
          weightKg: 30,
          reps: 10,
        },
        // A bar: the typed number already IS the total, the detail only describes it.
        {
          id: 's3',
          workoutLogId: 'l1',
          exerciseId: 'db-press',
          setNumber: 3,
          weightKg: 60,
          reps: 5,
          load: { kind: 'barbell', barKg: 20, platesKg: [20] },
        },
      ])
      .run();
  });

  it('the live program list doubles only the two-dumbbell set (json_extract in SQL)', () => {
    const [row] = programSessionsQuery('up1').all();
    expect(row.volumeKg).toBe(600 + 300 + 300);
  });

  it('the summary agrees with the live list', () => {
    expect(sessionSummary('l1').volumeKg).toBe(1200);
  });
});
