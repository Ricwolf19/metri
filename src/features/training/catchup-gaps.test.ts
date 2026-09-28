import { describe, expect, it } from 'vitest';

import { selectCatchupGaps, type CatchupInput } from './catchup-gaps';
import { localDateKey } from './dates';

// 2026-09-26 is a Saturday (weekday 7, expo-numbered).
const TODAY = '2026-09-26';
const YESTERDAY = '2026-09-25'; // Friday, weekday 6

// Every planned day of the last 30, except the ones a test wants unresolved.
const allPlannedBut = (except: string[]): Set<string> => {
  const logged = new Set<string>();
  const cursor = new Date(`${TODAY}T12:00:00`);
  for (let i = 1; i <= 30; i++) {
    cursor.setDate(cursor.getDate() - 1);
    // Local key: toISOString is UTC and shifts the day east of UTC+12.
    const key = localDateKey(cursor);
    if (cursor.getDay() + 1 === 6 || cursor.getDay() + 1 === 7) {
      if (!except.includes(key)) logged.add(key);
    }
  }
  return logged;
};

const base = (over: Partial<CatchupInput>): CatchupInput => ({
  logged: allPlannedBut([YESTERDAY]),
  plannedWeekdays: [6, 7], // Fri + Sat
  today: TODAY,
  checkinSchedule: [{ weekday: 7, hour: 18, minute: 0 }],
  offsetMinutes: 180,
  nowMinutes: 12 * 60, // noon — before today's check-in window
  ...over,
});

describe('selectCatchupGaps', () => {
  it('G3: training today after a missed planned yesterday surfaces the miss, not today', () => {
    const gaps = selectCatchupGaps(base({ logged: allPlannedBut([YESTERDAY]).add(TODAY) }));
    expect(gaps).toEqual([YESTERDAY]);
  });

  it('G3: answering the miss closes the catch-up; today stays out of the list', () => {
    const gaps = selectCatchupGaps(base({ logged: allPlannedBut([]).add(TODAY) }));
    expect(gaps).not.toContain(TODAY);
    expect(gaps).not.toContain(YESTERDAY);
    expect(gaps).toEqual([]);
  });

  it('asks about today first once its check-in window has passed, then the miss', () => {
    const gaps = selectCatchupGaps(
      base({ nowMinutes: 23 * 60, logged: allPlannedBut([YESTERDAY]) }),
    );
    expect(gaps).toEqual([TODAY, YESTERDAY]);
  });

  it('a day before its check-in window only surfaces older misses', () => {
    const gaps = selectCatchupGaps(base({}));
    expect(gaps).toEqual([YESTERDAY]);
  });

  it('returns nothing without a schedule to break a streak against', () => {
    expect(selectCatchupGaps(base({ plannedWeekdays: null }))).toEqual([]);
  });

  it('a running session holds back only today, never the missed yesterday', () => {
    const gaps = selectCatchupGaps(
      base({ nowMinutes: 23 * 60, sessionActive: true, logged: allPlannedBut([YESTERDAY]) }),
    );
    expect(gaps).toEqual([YESTERDAY]);
  });

  it('orders multiple misses oldest-first after today', () => {
    const friBefore = '2026-09-18';
    const gaps = selectCatchupGaps(
      base({ nowMinutes: 23 * 60, logged: allPlannedBut([YESTERDAY, friBefore]) }),
    );
    expect(gaps).toEqual([TODAY, friBefore, YESTERDAY]);
  });
});
