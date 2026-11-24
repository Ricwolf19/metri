import { beforeEach, describe, expect, it, vi } from 'vitest';

import { reconcileAutoAdherence } from './auto-adherence.repo';
import { closeSession } from './close-session';
import { getWorkout } from './session.repo';
import { readSessionDrafts, writeDraft } from './workout-drafts';

const calls: string[] = [];

vi.mock('@/features/notifications/rest-notification', () => ({
  endRest: vi.fn(async () => void calls.push('endRest')),
  endSession: vi.fn(async () => void calls.push('endSession')),
}));
vi.mock('./reminders', () => ({
  syncTrainingReminder: vi.fn(async (userId: string) => void calls.push(`reminder:${userId}`)),
}));
vi.mock('./auto-adherence.repo', () => ({
  reconcileAutoAdherence: vi.fn((userId: string) => void calls.push(`adherence:${userId}`)),
}));
vi.mock('@/lib/telemetry', () => ({
  captureError: vi.fn(() => void calls.push('captureError')),
}));
vi.mock('./rest-taken', () => ({
  restTaken: { clear: vi.fn(() => void calls.push('restTaken:clear')) },
}));
vi.mock('./session.repo', () => ({
  getWorkout: vi.fn(() => ({ status: 'in_progress', completedAt: null })),
  markRemainingSkipped: vi.fn((id: string) => void calls.push(`missed:${id}`)),
  finishWorkout: vi.fn((id: string) => void calls.push(`finish:${id}`)),
  abandonWorkout: vi.fn((id: string) => void calls.push(`abandon:${id}`)),
}));

describe('closeSession', () => {
  beforeEach(() => {
    calls.length = 0;
    writeDraft('log-1', 'slot-a:0', { weight: '100', reps: '8', effort: null });
  });

  it('finishes: open rows missed, saves, stops the rest and session, clears drafts, refreshes the reminder', () => {
    expect(closeSession('finish', 'log-1', 'user-1')).toBe(true);
    expect(calls).toEqual([
      'missed:log-1',
      'finish:log-1',
      'endRest',
      'restTaken:clear',
      'endSession',
      'reminder:user-1',
      'adherence:user-1',
    ]);
    expect(readSessionDrafts('log-1').size).toBe(0);
  });

  it('finishes even when the calendar fill throws: it is reported, never rethrown', () => {
    vi.mocked(reconcileAutoAdherence).mockImplementationOnce(() => {
      throw new Error('boom');
    });
    expect(() => closeSession('finish', 'log-1', 'user-1')).not.toThrow();
    expect(calls).toEqual([
      'missed:log-1',
      'finish:log-1',
      'endRest',
      'restTaken:clear',
      'endSession',
      'reminder:user-1',
      'captureError',
    ]);
    expect(readSessionDrafts('log-1').size).toBe(0);
  });

  it('abandons: same teardown, but the program did not move so the reminder stays', () => {
    expect(closeSession('abandon', 'log-1', 'user-1')).toBe(true);
    expect(calls).toEqual(['abandon:log-1', 'endRest', 'restTaken:clear', 'endSession']);
    // The stale-session dialog used to skip this, leaking drafts into the next run.
    expect(readSessionDrafts('log-1').size).toBe(0);
  });

  it('leaves a session that is closed already alone: no rewrite for sync, no teardown', () => {
    vi.mocked(getWorkout).mockReturnValueOnce({
      status: 'completed',
      completedAt: new Date(),
    } as never);
    expect(closeSession('finish', 'log-1', 'user-1')).toBe(false);
    expect(calls).toEqual([]);
  });

  it('refuses to abandon a reopened session: its sets were a finished session', () => {
    vi.mocked(getWorkout).mockReturnValueOnce({
      status: 'in_progress',
      completedAt: new Date(2026, 10, 24, 19),
    } as ReturnType<typeof getWorkout>);
    expect(closeSession('abandon', 'log-1', 'user-1')).toBe(false);
    expect(calls).toEqual([]);
    // Nothing was torn down: the session, its drafts and its card stay.
    expect(readSessionDrafts('log-1').size).toBe(1);
  });
});
