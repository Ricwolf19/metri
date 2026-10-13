import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  endSession,
  reconcileSession,
  registerRestBackgroundHandler,
  registerRestForegroundService,
  showSession,
} from './rest-notification';

/**
 * The stop guard behind a Sentry fatal: `stopForegroundService` with no service
 * alive cold-starts one just to stop it, and Android refuses that from the
 * background. Everything native is mocked; only the guard's state machine runs.
 */
const h = vi.hoisted(() => ({
  store: new Map<string, string>(),
  appState: 'active',
  listener: null as ((state: string) => void) | null,
  runner: null as ((n: { id: string }) => Promise<void>) | null,
  stopForegroundService: vi.fn(async () => {}),
  cancelNotification: vi.fn(async () => {}),
  displayNotification: vi.fn(async () => {}),
  background: null as ((e: unknown) => Promise<void>) | null,
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
  Linking: { openURL: vi.fn() },
  AppState: {
    get currentState() {
      return h.appState;
    },
    addEventListener: (_type: string, cb: (state: string) => void) => {
      h.listener = cb;
      return { remove() {} };
    },
  },
}));
vi.mock('react-native-notify-kit', () => ({
  default: {
    displayNotification: h.displayNotification,
    cancelNotification: h.cancelNotification,
    cancelTriggerNotification: vi.fn(async () => {}),
    createTriggerNotification: vi.fn(async () => {}),
    stopForegroundService: h.stopForegroundService,
    registerForegroundService: (fn: (n: { id: string }) => Promise<void>) => {
      h.runner = fn;
    },
    onBackgroundEvent: (fn: (e: unknown) => Promise<void>) => {
      h.background = fn;
    },
    onForegroundEvent: vi.fn(() => () => {}),
    getInitialNotification: vi.fn(async () => null),
    createChannel: vi.fn(async () => {}),
    deleteChannel: vi.fn(async () => {}),
  },
  AlarmType: {},
  AndroidCategory: {},
  AndroidForegroundServiceType: {},
  AndroidImportance: {},
  AndroidStyle: {},
  EventType: { DISMISSED: 'dismissed', ACTION_PRESS: 'action', PRESS: 'press' },
  TriggerType: {},
}));
vi.mock('react-native-mmkv', () => ({ useMMKVString: () => [undefined] }));
vi.mock('@/lib/storage', () => ({
  SettingKeys: { activeSession: 'training.activeSession', activeRest: 'training.activeRest' },
  storage: {
    getString: (k: string) => h.store.get(k),
    set: (k: string, v: string) => h.store.set(k, v),
    remove: (k: string) => h.store.delete(k),
  },
  session: { getUserId: () => null },
}));
vi.mock('@/lib/sounds', () => ({ startAlarm: vi.fn(), stopAlarm: vi.fn() }));
vi.mock('@/features/training/adherence.repo', () => ({ dayQuery: vi.fn() }));
vi.mock('./policies', () => ({
  holdCheckin: vi.fn(async () => {}),
  releaseCheckin: vi.fn(async () => {}),
}));
vi.mock('./session-service', () => ({ runSessionService: vi.fn(async () => {}) }));

const recordSession = () =>
  h.store.set(
    'training.activeSession',
    JSON.stringify({ workoutId: 'w1', startedAt: 0, title: 'Training', next: null }),
  );

/** Simulate Android starting our service: the registered task runs for `session`. */
const startService = async () => {
  recordSession();
  registerRestForegroundService();
  await h.runner?.({ id: 'session' });
};

describe('foreground service stop guard', () => {
  beforeEach(() => {
    h.store.clear();
    h.appState = 'active';
    h.stopForegroundService.mockClear();
    h.cancelNotification.mockClear();
    h.displayNotification.mockClear();
  });

  it('a card the lifter swiped away is not re-posted by the next logged set', async () => {
    registerRestBackgroundHandler();
    const session = { workoutId: 'w1', startedAt: 0, title: 'Training', next: null };
    await showSession(session);
    expect(h.displayNotification).toHaveBeenCalledTimes(1);

    await h.background?.({ type: 'dismissed', detail: { notification: { id: 'session' } } });
    await showSession({ ...session, next: null });
    expect(h.displayNotification).toHaveBeenCalledTimes(1);
    // A new workout starts clean.
    await showSession({ ...session, workoutId: 'w2' });
    expect(h.displayNotification).toHaveBeenCalledTimes(2);
  });

  it('never sends a STOP for a service this process did not start', async () => {
    recordSession();
    await endSession();
    expect(h.cancelNotification).toHaveBeenCalledWith('session');
    expect(h.stopForegroundService).not.toHaveBeenCalled();
  });

  it('a cold launch that finds no live session does not touch the service', async () => {
    await reconcileSession(() => false);
    expect(h.stopForegroundService).not.toHaveBeenCalled();
  });

  it('stops a service it started, exactly once', async () => {
    await startService();
    await endSession();
    await endSession();
    expect(h.stopForegroundService).toHaveBeenCalledTimes(1);
  });

  it('defers the STOP while backgrounded and sends it on the next return', async () => {
    await startService();
    h.appState = 'background';
    await endSession();
    expect(h.stopForegroundService).not.toHaveBeenCalled();
    // The card is gone regardless: only the service waits.
    expect(h.cancelNotification).toHaveBeenCalledWith('session');

    h.appState = 'active';
    h.listener?.('active');
    await vi.waitFor(() => expect(h.stopForegroundService).toHaveBeenCalledTimes(1));
  });
});
