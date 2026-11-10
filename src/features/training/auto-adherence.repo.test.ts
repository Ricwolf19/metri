import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  appMeta,
  programs,
  routines,
  trainingDays,
  userPrograms,
  users,
  workoutDays,
} from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));
vi.mock('./reminders', () => ({ syncTrainingReminder: vi.fn(async () => {}) }));

const { db } = await import('@/db/client');
const { reconcileAutoAdherence } = await import('./auto-adherence.repo');
const { markTrainingDay } = await import('./adherence.repo');

const U = 'u1';
const UP = 'up1';

const day = (date: string) =>
  db.select().from(trainingDays).where(eq(trainingDays.date, date)).all()[0] ?? null;

/** Enrolled 2026-11-02 (a Monday), push on Monday, pull on Wednesday. */
const seed = (status: 'active' | 'paused' = 'active') => {
  db.insert(users).values({ id: U, email: null, authKind: 'local' }).run();
  db.insert(programs).values({ id: 'prog', name: 'P', isCustom: true, userId: U }).run();
  db.insert(routines)
    .values({
      id: 'r',
      programId: 'prog',
      name: '',
      orderIndex: 0,
      durationWeeks: 4,
      userProgramId: UP,
    })
    .run();
  db.insert(workoutDays)
    .values([
      {
        id: 'push',
        routineId: 'r',
        name: 'Push',
        orderIndex: 0,
        weekday: 2,
        startMinute: 600,
        userProgramId: UP,
      },
      {
        id: 'pull',
        routineId: 'r',
        name: 'Pull',
        orderIndex: 1,
        weekday: 4,
        startMinute: 600,
        userProgramId: UP,
      },
    ])
    .run();
  db.insert(userPrograms)
    .values({
      id: UP,
      userId: U,
      programId: 'prog',
      status,
      startedAt: new Date(2026, 10, 2, 9),
      currentRoutineId: 'r',
      currentWeek: 1,
      trainingWeekdays: [2, 4],
    })
    .run();
};

describe('reconcileAutoAdherence', () => {
  beforeEach(() => {
    for (const t of [appMeta, trainingDays, userPrograms, workoutDays, routines, programs, users])
      db.delete(t).run();
  });

  it('marks passed planned days missed with the split they stood for, never today', () => {
    seed();
    expect(reconcileAutoAdherence(U, '2026-11-04')).toBe(1);
    expect(day('2026-11-02')).toMatchObject({
      status: 'skipped',
      skipReason: null,
      workoutDayId: 'push',
    });
    expect(day('2026-11-04')).toBeNull();
    expect(day('2026-11-03')).toBeNull();
  });

  it('turns the miss into a moved rest day once a session on an unplanned day makes it up', () => {
    seed();
    reconcileAutoAdherence(U, '2026-11-03');
    markTrainingDay(U, { date: '2026-11-03', status: 'trained' });
    reconcileAutoAdherence(U, '2026-11-04');
    expect(day('2026-11-02')).toMatchObject({ status: 'rest', skipReason: 'moved' });
  });

  it('is idempotent and leaves a day the lifter answered alone', () => {
    seed();
    markTrainingDay(U, { date: '2026-11-02', status: 'skipped', skipReason: 'sick' });
    expect(reconcileAutoAdherence(U, '2026-11-05')).toBe(1);
    expect(reconcileAutoAdherence(U, '2026-11-05')).toBe(0);
    expect(day('2026-11-02')).toMatchObject({ skipReason: 'sick' });
  });

  it('writes nothing without an active enrollment or a user', () => {
    seed('paused');
    expect(reconcileAutoAdherence(U, '2026-11-05')).toBe(0);
    expect(reconcileAutoAdherence('', '2026-11-05')).toBe(0);
  });

  it('never judges a settled day again when the schedule changes', () => {
    seed();
    reconcileAutoAdherence(U, '2026-11-05');
    // The lifter moves to Tuesday/Thursday: last Tuesday was a rest day then.
    db.update(userPrograms)
      .set({ trainingWeekdays: [3, 5] })
      .run();
    reconcileAutoAdherence(U, '2026-11-06');
    expect(day('2026-11-03')).toBeNull();
    expect(day('2026-11-05')).toMatchObject({ status: 'skipped' });
  });

  it('stamps an automatic mark at the start of its own day, so any real answer wins a sync', () => {
    seed();
    reconcileAutoAdherence(U, '2026-11-03');
    expect(day('2026-11-02')?.updatedAt?.getTime()).toBe(new Date(2026, 10, 2).getTime());
  });
});
