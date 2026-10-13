import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  programs,
  routines,
  trainingDays,
  userPrograms,
  users,
  workoutDays,
  workoutLogs,
} from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));
vi.mock('./reminders', () => ({ syncTrainingReminder: vi.fn(async () => {}) }));

const { db } = await import('@/db/client');
const { skipPlannedDay, skipSplitFromPlan, unskipDay } = await import('./skip-split');
const { markTrainingDay } = await import('./adherence.repo');

const U = 'u1';
const UP = 'up1';
// 2026-09-14 Mon (2), 2026-09-17 Thu (5), 2026-09-16 Wed (4).
const MON = '2026-09-14';
const THU = '2026-09-17';
const WED = '2026-09-16';

/** One active phase of two weeks: push on Monday, pull on Thursday. */
const seed = (week = 1) => {
  db.insert(programs).values({ id: 'prog', name: 'P', isCustom: true, userId: U }).run();
  db.insert(routines)
    .values({
      id: 'p1',
      programId: 'prog',
      name: '',
      orderIndex: 0,
      durationWeeks: 2,
      userProgramId: UP,
    })
    .run();
  db.insert(workoutDays)
    .values([
      {
        id: 'push',
        routineId: 'p1',
        name: 'Push',
        orderIndex: 0,
        weekday: 2,
        startMinute: 600,
        userProgramId: UP,
      },
      {
        id: 'pull',
        routineId: 'p1',
        name: 'Pull',
        orderIndex: 1,
        weekday: 5,
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
      status: 'active',
      currentRoutineId: 'p1',
      currentWeek: week,
    })
    .run();
};

const logs = () => db.select().from(workoutLogs).all();
const day = (date: string) =>
  db.select().from(trainingDays).where(eq(trainingDays.date, date)).all()[0];
const week = () =>
  db.select().from(userPrograms).where(eq(userPrograms.id, UP)).all()[0].currentWeek;
const completed = (dayId: string, weekNumber: number) =>
  db
    .insert(workoutLogs)
    .values({
      id: crypto.randomUUID(),
      userId: U,
      userProgramId: UP,
      workoutDayId: dayId,
      weekNumber,
      status: 'completed',
      completedAt: new Date(),
    })
    .run();

describe('skipPlannedDay', () => {
  beforeEach(() => {
    for (const t of [
      trainingDays,
      workoutLogs,
      workoutDays,
      routines,
      userPrograms,
      programs,
      users,
    ])
      db.delete(t).run();
    db.insert(users).values({ id: U, email: null, authKind: 'local' }).run();
  });

  it('maps the day onto its planned split, writes the skipped log and the linked mark', () => {
    seed();
    skipPlannedDay(U, MON, 'sick');
    expect(logs()).toHaveLength(1);
    expect(logs()[0]).toMatchObject({ status: 'skipped', workoutDayId: 'push', weekNumber: 1 });
    expect(day(MON)).toMatchObject({
      status: 'skipped',
      skipReason: 'sick',
      workoutLogId: logs()[0].id,
      workoutDayId: 'push',
    });
    expect(week()).toBe(1);
  });

  it('resolves the week once every split is done or skipped, and says so', () => {
    seed();
    completed('push', 1);
    expect(skipPlannedDay(U, THU, 'busy')).toEqual({ advanced: true });
    expect(week()).toBe(2);
  });

  it('writes an adherence-only mark for a day that maps to no split or to one already resolved', () => {
    seed();
    skipPlannedDay(U, WED, 'travel');
    expect(logs()).toHaveLength(0);
    expect(day(WED)).toMatchObject({ status: 'skipped', workoutLogId: null });

    completed('push', 1);
    skipPlannedDay(U, MON, 'fatigue');
    expect(logs().filter((l) => l.status === 'skipped')).toHaveLength(0);
    expect(day(MON)).toMatchObject({ status: 'skipped', skipReason: 'fatigue' });
  });

  it('re-marking a skipped day with another reason keeps the undo handle', () => {
    seed();
    skipPlannedDay(U, MON, 'sick');
    const logId = logs()[0].id;
    skipPlannedDay(U, MON, 'busy');
    expect(logs()).toHaveLength(1);
    expect(day(MON)).toMatchObject({ skipReason: 'busy', workoutLogId: logId });
  });

  it('never overwrites a day already marked trained', () => {
    seed();
    markTrainingDay(U, { date: MON, status: 'trained' });
    skipSplitFromPlan(
      U,
      db.select().from(userPrograms).all()[0],
      {
        id: 'push',
        routineId: 'p1',
        name: 'Push',
        orderIndex: 0,
        weekday: 2,
        startMinute: 600,
      },
      'moved',
      WED,
    );
    expect(day(MON).status).toBe('trained');
    expect(logs()[0]).toMatchObject({ status: 'skipped', workoutDayId: 'push' });
  });

  it('unskipDay deletes the log, releases the day and rewinds the week', () => {
    seed();
    completed('push', 1);
    skipPlannedDay(U, THU, 'busy');
    expect(week()).toBe(2);

    expect(unskipDay(U, THU)).toBe(true);
    expect(logs().filter((l) => l.status === 'skipped')).toHaveLength(0);
    expect(day(THU)).toBeUndefined();
    expect(week()).toBe(1);
    expect(unskipDay(U, THU)).toBe(false);
  });
});
