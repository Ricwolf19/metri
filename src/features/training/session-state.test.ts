import { beforeEach, describe, expect, it, vi } from 'vitest';

import { isSessionInProgress, sessionState } from './session-state';

const store = new Map<string, string>();
vi.mock('@/lib/storage', () => ({
  SettingKeys: { activeSession: 'training.activeSession' },
  storage: {
    getString: (k: string) => store.get(k),
    set: (k: string, v: string) => store.set(k, v),
    remove: (k: string) => store.delete(k),
  },
}));

const HOUR = 60 * 60 * 1000;
const session = (startedAt: number) => ({
  workoutId: 'w1',
  startedAt,
  title: 'Training in progress',
  next: null,
  doneLabel: 'All planned sets done',
});

describe('isSessionInProgress', () => {
  beforeEach(() => store.clear());

  it('is false with no session recorded', () => {
    expect(isSessionInProgress(0)).toBe(false);
  });

  it('holds while the session is fresh', () => {
    sessionState.set(session(0));
    expect(isSessionInProgress(HOUR)).toBe(true);
  });

  it('lets go of a session left open for hours, so it cannot hold the check-in forever', () => {
    sessionState.set(session(0));
    expect(isSessionInProgress(5 * HOUR)).toBe(false);
  });

  it('treats a corrupt stored value as no session', () => {
    store.set('training.activeSession', '{broken');
    expect(isSessionInProgress(0)).toBe(false);
  });
});
