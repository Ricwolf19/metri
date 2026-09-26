import { describe, expect, it } from 'vitest';

import { CHECKIN_DELAY_MIN, decideCheckin } from './checkin-delay';

const NOW = 1_000_000;

describe('decideCheckin', () => {
  it('asks when no session runs and nothing is snoozed', () => {
    expect(decideCheckin({ sessionActive: false, snoozedUntil: 0, now: NOW })).toEqual({
      ask: true,
    });
  });

  it('postpones ~1h while a session is in progress', () => {
    const d = decideCheckin({ sessionActive: true, snoozedUntil: 0, now: NOW });
    expect(d).toEqual({ ask: false, snoozeUntil: NOW + CHECKIN_DELAY_MIN * 60_000 });
  });

  it('keeps the prompt away while a snooze from an earlier session still stands', () => {
    const until = NOW + 5 * 60_000;
    expect(decideCheckin({ sessionActive: false, snoozedUntil: until, now: NOW })).toEqual({
      ask: false,
      snoozeUntil: until,
    });
  });

  it('asks again once the snooze expired with the session over', () => {
    expect(decideCheckin({ sessionActive: false, snoozedUntil: NOW - 1, now: NOW })).toEqual({
      ask: true,
    });
  });

  it('re-arms the snooze on every check during a long session', () => {
    const d = decideCheckin({ sessionActive: true, snoozedUntil: NOW + 60_000, now: NOW });
    expect(d).toEqual({ ask: false, snoozeUntil: NOW + CHECKIN_DELAY_MIN * 60_000 });
  });
});
