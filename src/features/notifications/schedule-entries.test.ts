import { describe, expect, it } from 'vitest';

import { isDailyAtOneTime, scheduleEntries } from './schedule-entries';

describe('scheduleEntries', () => {
  it('fans a single time out over the weekdays', () => {
    expect(scheduleEntries({ enabled: true, hour: 18, minute: 0, weekdays: [2, 4] })).toEqual([
      { weekday: 2, hour: 18, minute: 0 },
      { weekday: 4, hour: 18, minute: 0 },
    ]);
  });

  it('prefers an explicit per-split schedule', () => {
    const schedule = [{ weekday: 2, hour: 7, minute: 30 }];
    expect(
      scheduleEntries({ enabled: true, hour: 18, minute: 0, weekdays: [2, 4], schedule }),
    ).toBe(schedule);
  });
});

describe('isDailyAtOneTime', () => {
  const at = (weekday: number, hour = 9) => ({ weekday, hour, minute: 0 });

  it('is true only for all seven weekdays at one time', () => {
    expect(isDailyAtOneTime([1, 2, 3, 4, 5, 6, 7].map((w) => at(w)))).toBe(true);
    expect(isDailyAtOneTime([1, 2, 3, 4, 5, 6].map((w) => at(w)))).toBe(false);
    expect(isDailyAtOneTime([...[1, 2, 3, 4, 5, 6].map((w) => at(w)), at(7, 10)])).toBe(false);
  });
});
