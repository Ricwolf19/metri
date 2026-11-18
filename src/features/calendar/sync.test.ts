import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { programs, routines, userPrograms, workoutDays } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

const mocks = vi.hoisted(() => ({
  state: null as unknown,
  /** Events the fake calendar holds, by id. */
  events: new Map<string, { title: string; startDate: Date }>(),
  creates: 0,
  /** The 1-based create call that throws, or null. */
  failOn: null as number | null,
  captureError: vi.fn(),
}));

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));
vi.mock('@/lib/telemetry', () => ({ captureError: mocks.captureError }));
vi.mock('@/lib/storage', () => ({
  settings: {
    getCalendarSync: () => true,
    getCalendarState: () => mocks.state,
    // Stored as JSON, the way MMKV keeps it.
    setCalendarState: (state: unknown) => {
      mocks.state = JSON.parse(JSON.stringify(state));
    },
  },
}));
vi.mock('@/i18n', () => ({
  resolveLocale: () => 'en',
  tFor: () => (key: string, vars?: Record<string, unknown>) =>
    vars ? `${key} ${JSON.stringify(vars)}` : key,
}));
vi.mock('@/features/notifications/policies', () => ({
  getEventConfig: () => ({ hour: 18, minute: 0 }),
}));
vi.mock('expo-calendar', () => {
  const calendar = {
    id: 'cal-metri',
    createEvent: async (event: { title: string; startDate: Date }) => {
      mocks.creates += 1;
      if (mocks.creates === mocks.failOn) throw new Error('provider refused');
      const id = `ev-${mocks.creates}`;
      mocks.events.set(id, event);
      return { id };
    },
  };
  return {
    EntityTypes: { EVENT: 'event' },
    CalendarAccessLevel: { OWNER: 'owner' },
    getCalendarPermissions: async () => ({ granted: true }),
    getCalendars: async () => [],
    createCalendar: async () => calendar,
    ExpoCalendar: {
      get: async (id: string) => {
        if (id !== calendar.id) throw new Error('no such calendar');
        return calendar;
      },
    },
    ExpoCalendarEvent: {
      get: async (id: string) => ({ delete: async () => void mocks.events.delete(id) }),
    },
  };
});

const { db } = await import('@/db/client');
const { syncTrainingCalendar } = await import('./sync');

const USER = 'u1';

/** "YYYY-MM-DD HH:mm" of every event the calendar holds, sorted. */
const booked = () =>
  [...mocks.events.values()]
    .map(({ startDate: d }) => {
      const p = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    })
    .sort();

// Monday 2026-11-16: the four weeks ahead hold eight Monday/Thursday sessions.
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(new Date(2026, 10, 16, 8, 0));
afterAll(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  for (const t of [userPrograms, workoutDays, routines, programs]) db.delete(t).run();
  db.insert(programs).values({ id: 'p', name: 'Plan', isCustom: true, userId: USER }).run();
  db.insert(routines)
    .values({ id: 'r', programId: 'p', name: '', orderIndex: 0, durationWeeks: 8 })
    .run();
  db.insert(workoutDays)
    .values([
      { id: 'a', routineId: 'r', name: 'A', orderIndex: 0, weekday: 2 },
      { id: 'b', routineId: 'r', name: 'B', orderIndex: 1, weekday: 5 },
    ])
    .run();
  db.insert(userPrograms)
    .values({ id: 'up', userId: USER, programId: 'p', currentRoutineId: 'r', currentWeek: 1 })
    .run();
  mocks.state = null;
  mocks.events.clear();
  mocks.creates = 0;
  mocks.failOn = null;
  mocks.captureError.mockClear();
});

describe('syncTrainingCalendar', () => {
  it('books the planned days at the training time', async () => {
    await syncTrainingCalendar(USER);
    expect(booked()).toEqual([
      '2026-11-16 18:00',
      '2026-11-19 18:00',
      '2026-11-23 18:00',
      '2026-11-26 18:00',
      '2026-11-30 18:00',
      '2026-12-03 18:00',
      '2026-12-07 18:00',
      '2026-12-10 18:00',
    ]);
  });

  // The ids used to be stored only once every event was written: a throw halfway
  // forgot the ones already made, and the next run booked those days twice.
  it('records each event as it is written, so a failure halfway never doubles a day', async () => {
    mocks.failOn = 3;
    await syncTrainingCalendar(USER);
    expect(mocks.captureError).toHaveBeenCalledTimes(1);
    expect(mocks.events.size).toBe(2);

    mocks.failOn = null;
    await syncTrainingCalendar(USER);
    const days = booked();
    expect(days).toHaveLength(8);
    expect(new Set(days).size).toBe(8);
  });

  it('keeps what still stands and replaces only what moved', async () => {
    await syncTrainingCalendar(USER);
    const before = new Set(mocks.events.keys());
    db.update(workoutDays).set({ weekday: 6 }).where(eq(workoutDays.id, 'b')).run();

    await syncTrainingCalendar(USER);
    const days = booked();
    expect(days.filter((d) => d.startsWith('2026-11-19'))).toEqual([]);
    expect(days).toContain('2026-11-20 18:00');
    // The four Mondays survive untouched; only the moved split was rewritten.
    expect([...mocks.events.keys()].filter((id) => before.has(id))).toHaveLength(4);
    expect(days).toHaveLength(8);
  });
});
