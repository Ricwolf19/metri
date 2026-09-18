import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { exercises, programs, routines, trainingDays, workoutLogs } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { importUserData } = await import('./import');

const ME = 'importer';

describe('importUserData', () => {
  beforeEach(() => {
    for (const table of [trainingDays, workoutLogs, routines, programs, exercises]) {
      db.delete(table).run();
    }
  });

  it('regenerates ids, rewrites foreign keys and forces ownership to the importer', () => {
    const summary = importUserData(ME, {
      data: {
        programs: [{ id: 'p-old', name: 'PPL', isCustom: true, userId: 'someone-else' }],
        routines: [{ id: 'r-old', programId: 'p-old', name: 'Base' }],
        exercises: [{ id: 'ex-seed', name: 'Squat', category: 'legs', userId: null }],
      },
    });

    const [program] = db.select().from(programs).all();
    const [routine] = db.select().from(routines).all();
    const [exercise] = db.select().from(exercises).all();
    expect(program.id).not.toBe('p-old');
    expect(program.userId).toBe(ME);
    expect(routine.programId).toBe(program.id);
    // NULL ownership is preserved (a seeded exercise stays a seed).
    expect(exercise.userId).toBeNull();
    expect(summary).toMatchObject({ programs: 1, routines: 1, exercises: 1, setLogs: 0 });
  });

  it('revives ISO and epoch-ms timestamps and falls back for unparsable ones', () => {
    importUserData(ME, {
      data: {
        workoutLogs: [
          {
            id: 'w1',
            userId: 'x',
            userProgramId: 'up',
            workoutDayId: 'd',
            weekNumber: 1,
            status: 'completed',
            startedAt: 1_758_000_000_000,
            completedAt: '2026-09-16T10:00:00.000Z',
            createdAt: 'not a date',
          },
        ],
      },
    });
    const [log] = db.select().from(workoutLogs).all();
    expect(log.startedAt.getTime()).toBe(1_758_000_000_000);
    expect(log.completedAt?.toISOString()).toBe('2026-09-16T10:00:00.000Z');
    expect(log.createdAt).toBeInstanceOf(Date);
    expect(log.userId).toBe(ME);
  });

  it('skips training days already logged for that date instead of failing the whole import', () => {
    db.insert(trainingDays)
      .values({ id: 'mine', userId: ME, date: '2026-09-16', status: 'rest' })
      .run();

    importUserData(ME, {
      data: {
        trainingDays: [
          { id: 'a', userId: ME, date: '2026-09-16', status: 'trained' },
          { id: 'b', userId: ME, date: '2026-09-17', status: 'trained' },
        ],
      },
    });

    const rows = db.select().from(trainingDays).where(eq(trainingDays.userId, ME)).all();
    expect(rows.map((r) => `${r.date}:${r.status}`).sort()).toEqual([
      '2026-09-16:rest',
      '2026-09-17:trained',
    ]);
  });
});
