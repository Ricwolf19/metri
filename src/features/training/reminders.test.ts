import { beforeEach, describe, expect, it, vi } from 'vitest';

import { programs, routines, userPrograms, users, workoutDays } from '@/db/schema';
import type { EventConfig } from '@/features/notifications/events';
import { createTestDb } from '@/test/sqlite';

const stored = new Map<string, EventConfig>();

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));
vi.mock('@/lib/storage', () => ({
  settings: {
    setEventConfig: (id: string, cfg: EventConfig) => stored.set(id, cfg),
  },
}));
vi.mock('@/features/notifications/policies', () => ({
  getEventConfig: (e: { id: string; defaults: EventConfig }) => ({
    ...e.defaults,
    ...stored.get(e.id),
  }),
  syncNotificationEvents: vi.fn(async () => {}),
}));

const { db } = await import('@/db/client');
const { syncTrainingReminder } = await import('./reminders');

const U = 'u1';
const UP = 'up1';

/** An enrollment on Monday and Thursday; `startMinute` is what an older build stored. */
const seed = (startMinutes: (number | null)[]) => {
  db.insert(users).values({ id: U, email: null, authKind: 'local' }).run();
  db.insert(programs).values({ id: 'prog', name: 'P', isCustom: true, userId: U }).run();
  db.insert(routines)
    .values({ id: 'r', programId: 'prog', name: '', orderIndex: 0, durationWeeks: 4 })
    .run();
  const weekdays = [2, 5, 2];
  db.insert(workoutDays)
    .values(
      startMinutes.map((startMinute, i) => ({
        id: `d${i}`,
        routineId: 'r',
        name: '',
        orderIndex: i,
        weekday: weekdays[i],
        startMinute,
        userProgramId: UP,
      })),
    )
    .run();
  db.insert(userPrograms)
    .values({
      id: UP,
      userId: U,
      programId: 'prog',
      status: 'active',
      startedAt: new Date(2026, 10, 2, 9),
      currentRoutineId: 'r',
      currentWeek: 1,
      trainingWeekdays: [2, 5],
    })
    .run();
};

const at = (hour: number, minute = 0) => [
  { weekday: 2, hour, minute },
  { weekday: 5, hour, minute },
];

describe('syncTrainingReminder', () => {
  beforeEach(() => {
    stored.clear();
    db.delete(userPrograms).run();
    db.delete(workoutDays).run();
    db.delete(routines).run();
    db.delete(programs).run();
    db.delete(users).run();
  });

  it('schedules each training weekday once, at the reminder time', async () => {
    seed([null, null, null]);
    await syncTrainingReminder(U, { enable: true });
    expect(stored.get('training-time')).toMatchObject({ enabled: true, schedule: at(18) });
    expect(stored.get('training-time')?.timeSet).toBeUndefined();
    // The check-in rides the same raw schedule and adds its own delay later.
    expect(stored.get('session-checkin')?.schedule).toEqual(at(18));
  });

  // An upgrade must not move a 7 am reminder to the 18:00 default.
  it('seeds the time ONCE from the split times an older build stored', async () => {
    seed([420, 1080, 420]);
    await syncTrainingReminder(U);
    expect(stored.get('training-time')).toMatchObject({ hour: 7, minute: 0, timeSet: true });
    expect(stored.get('training-time')?.schedule).toEqual(at(7));
  });

  it('keeps a time the lifter chose over any stored split time', async () => {
    seed([420, 420, 420]);
    stored.set('training-time', {
      enabled: true,
      hour: 20,
      minute: 30,
      weekdays: [],
      timeSet: true,
    });
    await syncTrainingReminder(U);
    expect(stored.get('training-time')?.schedule).toEqual(at(20, 30));
    expect(stored.get('session-checkin')?.schedule).toEqual(at(20, 30));
  });
});
