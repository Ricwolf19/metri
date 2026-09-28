import { beforeEach, describe, expect, it, vi } from 'vitest';

import { closeSession } from './close-session';
import { readSessionDrafts, writeDraft } from './workout-drafts';

const calls: string[] = [];

vi.mock('@/features/notifications/rest-notification', () => ({
  endRest: vi.fn(async () => void calls.push('endRest')),
  endSession: vi.fn(async () => void calls.push('endSession')),
}));
vi.mock('./reminders', () => ({
  syncTrainingReminder: vi.fn(async (userId: string) => void calls.push(`reminder:${userId}`)),
}));
vi.mock('./session.repo', () => ({
  finishWorkout: vi.fn((id: string) => void calls.push(`finish:${id}`)),
  abandonWorkout: vi.fn((id: string) => void calls.push(`abandon:${id}`)),
}));

describe('closeSession', () => {
  beforeEach(() => {
    calls.length = 0;
    writeDraft('log-1', 'slot-a:0', { weight: '100', reps: '8', effort: null });
  });

  it('finishes: saves, stops the rest and session, clears drafts, refreshes the reminder', () => {
    closeSession('finish', 'log-1', 'user-1');
    expect(calls).toEqual(['finish:log-1', 'endRest', 'endSession', 'reminder:user-1']);
    expect(readSessionDrafts('log-1').size).toBe(0);
  });

  it('abandons: same teardown, but the program did not move so the reminder stays', () => {
    closeSession('abandon', 'log-1', 'user-1');
    expect(calls).toEqual(['abandon:log-1', 'endRest', 'endSession']);
    // The stale-session dialog used to skip this, leaking drafts into the next run.
    expect(readSessionDrafts('log-1').size).toBe(0);
  });
});
