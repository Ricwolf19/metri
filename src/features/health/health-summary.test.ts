import { describe, expect, it } from 'vitest';

import { sleepParts, summarizeHealth, type HealthDay } from './health-summary';

const day = (d: number, over: Partial<HealthDay> = {}): HealthDay => ({
  day: `2026-11-${String(d).padStart(2, '0')}`,
  steps: null,
  activeKcal: null,
  sleepMin: null,
  ...over,
});

describe('summarizeHealth', () => {
  const today = '2026-11-17';

  it('shows today so far and last night, and averages the week before', () => {
    const days = [
      day(9, { steps: 99_999 }), // eight days back: outside the week
      ...[10, 11, 12, 13, 14, 15, 16].map((d) =>
        day(d, { steps: 8000, activeKcal: 400, sleepMin: 420 }),
      ),
      day(17, { steps: 1200, activeKcal: 60, sleepMin: 480 }),
    ];
    expect(summarizeHealth(days, today)).toEqual({
      today: { steps: 1200, activeKcal: 60 },
      lastNightSleepMin: 480,
      // Today's half-done steps stay out; last night counts among the nights.
      average: { steps: 8000, activeKcal: 400, sleepMin: Math.round((420 * 6 + 480) / 7) },
    });
  });

  // A day the phone recorded nothing is unknown: averaging it as zero halved the week.
  it('averages only the days that recorded something', () => {
    const days = [day(15, { steps: 10_000 }), day(16), day(17)];
    expect(summarizeHealth(days, today).average.steps).toBe(10_000);
  });

  it('is all unknown with nothing recorded', () => {
    expect(summarizeHealth([day(17)], today)).toEqual({
      today: { steps: null, activeKcal: null },
      lastNightSleepMin: null,
      average: { steps: null, activeKcal: null, sleepMin: null },
    });
  });
});

describe('sleepParts', () => {
  it('splits minutes into hours and the rest', () => {
    expect(sleepParts(445)).toEqual({ hours: 7, minutes: 25 });
  });
});
