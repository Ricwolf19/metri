import { describe, expect, it } from 'vitest';

import { isDailyAtOneTime, scheduleEntries, shiftEntries } from './schedule-entries';

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

describe('shiftEntries', () => {
  it('delays within the same day', () => {
    expect(shiftEntries([{ weekday: 2, hour: 18, minute: 0 }], 180)).toEqual([
      { weekday: 2, hour: 21, minute: 0 },
    ]);
  });

  it('rolls into the next weekday past midnight, wrapping Saturday to Sunday', () => {
    expect(shiftEntries([{ weekday: 7, hour: 22, minute: 30 }], 240)).toEqual([
      { weekday: 1, hour: 2, minute: 30 },
    ]);
  });

  it('collapses two sessions that land on the same slot', () => {
    const entries = [
      { weekday: 3, hour: 7, minute: 0 },
      { weekday: 3, hour: 7, minute: 0 },
    ];
    expect(shiftEntries(entries, 180)).toEqual([{ weekday: 3, hour: 10, minute: 0 }]);
  });

  it('sorts by weekday then time', () => {
    const entries = [
      { weekday: 5, hour: 19, minute: 0 },
      { weekday: 2, hour: 6, minute: 0 },
    ];
    expect(shiftEntries(entries, 60)).toEqual([
      { weekday: 2, hour: 7, minute: 0 },
      { weekday: 5, hour: 20, minute: 0 },
    ]);
  });
});
