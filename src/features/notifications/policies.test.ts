import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EventConfig } from './events';

const mocks = vi.hoisted(() => ({
  configs: new Map<string, unknown>(),
  ids: new Map<string, string[]>(),
  trainingHold: null as string | null,
  checkinHold: null as unknown,
  weekly: [] as { weekday: number; hour: number; minute: number; title: string }[],
  once: [] as { at: number; title: string }[],
  dismissed: [] as string[],
}));

vi.mock('@/i18n', () => ({ resolveLocale: () => 'en' }));
vi.mock('@/lib/storage', () => ({
  settings: {
    getNotificationsEnabled: () => true,
    getEventConfig: (id: string, defaults: EventConfig) => ({
      ...defaults,
      ...(mocks.configs.get(id) as object),
    }),
    getEventIds: (id: string) => mocks.ids.get(id) ?? [],
    setEventIds: (id: string, ids: string[]) => mocks.ids.set(id, ids),
    clearEvent: () => {},
    getCheckinHold: () => mocks.checkinHold,
    setCheckinHold: (hold: unknown) => {
      mocks.checkinHold = hold;
    },
    clearCheckinHold: () => {
      mocks.checkinHold = null;
    },
    getTrainingHold: () => mocks.trainingHold,
    setTrainingHold: (day: string) => {
      mocks.trainingHold = day;
    },
    clearTrainingHold: () => {
      mocks.trainingHold = null;
    },
  },
}));
vi.mock('./service', () => ({
  cancelNotifications: async () => {},
  ensureNotificationPermission: async () => true,
  dismissPresented: async (event: string) => {
    mocks.dismissed.push(event);
  },
  scheduleDaily: async () => 'daily',
  scheduleWeekly: async (
    _kind: string,
    weekday: number,
    hour: number,
    minute: number,
    content: { title: string },
  ) => {
    mocks.weekly.push({ weekday, hour, minute, title: content.title });
    return `w${mocks.weekly.length}`;
  },
  scheduleOnce: async (_kind: string, at: Date, content: { title: string }) => {
    mocks.once.push({ at: at.getTime(), title: content.title });
    return `o${mocks.once.length}`;
  },
}));

const { en } = await import('@/i18n/en');
const { holdSessionReminders, syncNotificationEvents } = await import('./policies');

const TRAIN = en['notif.trainingTitle'];
// 2026-09-26 is a Saturday (expo weekday 7); the program trains Wed and Sat at 18:00.
const at = (d: number, h: number, m = 0) => new Date(2026, 8, d, h, m).getTime();
const schedule = [
  { weekday: 4, hour: 18, minute: 0 },
  { weekday: 7, hour: 18, minute: 0 },
];

const trainingWeekly = () => mocks.weekly.filter((e) => e.title === TRAIN);
const trainingOnce = () => mocks.once.filter((e) => e.title === TRAIN);

describe('training-time while a session runs', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.configs.clear();
    mocks.ids.clear();
    mocks.trainingHold = null;
    mocks.checkinHold = null;
    mocks.weekly = [];
    mocks.once = [];
    mocks.dismissed = [];
    for (const id of ['metri-tips', 'weigh-in', 'calories'])
      mocks.configs.set(id, { enabled: false });
    mocks.configs.set('training-time', { enabled: true, schedule });
    mocks.configs.set('session-checkin', { enabled: false });
  });

  // A session started at 17:40 used to get "warm up and get to it" at 18:00, mid-set.
  it('holds back the day of a session that started before its reminder', async () => {
    vi.setSystemTime(at(26, 17, 40));
    await holdSessionReminders(at(26, 17, 40));
    expect(trainingWeekly().map((e) => e.weekday)).toEqual([4]);
    // Dropping the weekly trigger drops next Saturday too: it rides as a one-shot.
    expect(trainingOnce()).toEqual([{ at: at(26 + 7, 18), title: TRAIN }]);
    expect(mocks.dismissed).toEqual(['training-time']);
  });

  it('restores the weekly reminder once the held moment has passed', async () => {
    vi.setSystemTime(at(26, 17, 40));
    await holdSessionReminders(at(26, 17, 40));
    mocks.weekly = [];
    mocks.once = [];
    vi.setSystemTime(at(26, 18, 1));
    await syncNotificationEvents();
    expect(trainingWeekly().map((e) => e.weekday)).toEqual([4, 7]);
    expect(trainingOnce()).toEqual([]);
    expect(mocks.trainingHold).toBeNull();
  });

  it('holds nothing when the session day has no reminder', async () => {
    vi.setSystemTime(at(25, 9));
    await holdSessionReminders(at(25, 9));
    expect(trainingWeekly().map((e) => e.weekday)).toEqual([4, 7]);
    expect(trainingOnce()).toEqual([]);
  });
});
