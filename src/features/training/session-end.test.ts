import { describe, expect, it } from 'vitest';

import { isReopened, SESSION_IDLE_CAP_MS, sessionEndAt, sessionFiling } from './session-end';

const MIN = 60_000;
const START = new Date(2026, 10, 24, 18, 0).getTime();

describe('sessionEndAt', () => {
  it('ends at the finish tap while the session is still active', () => {
    const lastSet = START + 60 * MIN;
    expect(
      sessionEndAt({ startedAt: START, lastActivityAt: lastSet, now: lastSet + 5 * MIN }),
    ).toBe(lastSet + 5 * MIN);
  });

  it('ends exactly at the cap: the tap still counts', () => {
    const lastSet = START + 60 * MIN;
    const now = lastSet + SESSION_IDLE_CAP_MS;
    expect(sessionEndAt({ startedAt: START, lastActivityAt: lastSet, now })).toBe(now);
  });

  it('ends at the last set once the session sat idle past the cap (the forgotten finish)', () => {
    const lastSet = START + 70 * MIN;
    // Saved the next morning from the stale prompt: 15 hours later.
    const now = lastSet + 15 * 60 * MIN;
    expect(sessionEndAt({ startedAt: START, lastActivityAt: lastSet, now })).toBe(lastSet);
  });

  it('ends at the start when nothing was logged and it sat idle', () => {
    expect(
      sessionEndAt({ startedAt: START, lastActivityAt: null, now: START + 3 * 60 * MIN }),
    ).toBe(START);
  });

  it('a session with no sets finished soon after the start ends at the tap', () => {
    expect(sessionEndAt({ startedAt: START, lastActivityAt: null, now: START + 10 * MIN })).toBe(
      START + 10 * MIN,
    );
  });

  it('never ends before it started (a clock moved back, a set synced with an older stamp)', () => {
    expect(
      sessionEndAt({ startedAt: START, lastActivityAt: START - MIN, now: START - 2 * MIN }),
    ).toBe(START);
  });

  it('a reopened session keeps its first end when nothing new was logged, however long it sat', () => {
    const firstEnd = START + 65 * MIN;
    for (const now of [firstEnd + 2 * MIN, firstEnd + 3 * 60 * MIN]) {
      expect(
        sessionEndAt({
          startedAt: START,
          lastActivityAt: START + 64 * MIN,
          now,
          firstFinishedAt: firstEnd,
        }),
      ).toBe(firstEnd);
    }
  });

  it('a reopened session moves its end to a set logged after the reopen', () => {
    const firstEnd = START + 65 * MIN;
    const added = firstEnd + 6 * MIN;
    expect(
      sessionEndAt({
        startedAt: START,
        lastActivityAt: added,
        now: added + 40 * MIN,
        firstFinishedAt: firstEnd,
      }),
    ).toBe(added);
  });
});

describe('sessionFiling', () => {
  it('files a first finish on the day it ended', () => {
    const end = new Date(2026, 10, 24, 19, 10).getTime();
    expect(sessionFiling({ endAt: end, firstFinishedAt: null })).toEqual({
      completedAt: end,
      day: '2026-11-24',
    });
  });

  it('a session ended at its last set yesterday is filed yesterday, not on the day it was saved', () => {
    const lastSet = new Date(2026, 10, 23, 21, 40).getTime();
    expect(sessionFiling({ endAt: lastSet, firstFinishedAt: null }).day).toBe('2026-11-23');
  });

  it('a re-finish on the same day takes the new end', () => {
    const first = new Date(2026, 10, 24, 19, 10).getTime();
    const end = new Date(2026, 10, 24, 19, 25).getTime();
    expect(sessionFiling({ endAt: end, firstFinishedAt: first })).toEqual({
      completedAt: end,
      day: '2026-11-24',
    });
  });

  it('a re-finish past midnight stays on the day it was first finished', () => {
    const first = new Date(2026, 10, 24, 23, 50).getTime();
    const end = new Date(2026, 10, 25, 0, 12).getTime();
    expect(sessionFiling({ endAt: end, firstFinishedAt: first })).toEqual({
      completedAt: first,
      day: '2026-11-24',
    });
  });
});

describe('isReopened', () => {
  it('is an open session that was finished once', () => {
    expect(isReopened({ status: 'in_progress', completedAt: new Date(START) })).toBe(true);
  });

  it('is not a fresh session, nor a finished or abandoned one', () => {
    expect(isReopened({ status: 'in_progress', completedAt: null })).toBe(false);
    expect(isReopened({ status: 'completed', completedAt: new Date(START) })).toBe(false);
    expect(isReopened({ status: 'abandoned', completedAt: null })).toBe(false);
  });
});
