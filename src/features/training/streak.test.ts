import { describe, expect, it } from 'vitest';

import { findGaps, streakFromEntries } from './streak';

// 2026-09-16 is a Wednesday (expo weekday 4).
const TODAY = '2026-09-16';
const MON_WED_FRI = [2, 4, 6];

const entries = (pairs: [string, 'trained' | 'rest' | 'skipped'][]) => new Map(pairs);

describe('streakFromEntries', () => {
  it.each([
    ['empty history', entries([]), null, 0],
    [
      'consecutive trained days count',
      entries([
        ['2026-09-15', 'trained'],
        ['2026-09-14', 'trained'],
      ]),
      null,
      2,
    ],
    [
      'without a schedule an unlogged day breaks',
      entries([
        ['2026-09-15', 'trained'],
        // 09-13 unlogged
        ['2026-09-12', 'trained'],
      ]),
      null,
      1,
    ],
    [
      'with a schedule, unlogged NON-planned days are neutral',
      entries([
        ['2026-09-14', 'trained'], // Mon (planned)
        // 09-13 Sun, 09-12 Sat — not planned, unlogged → neutral
        ['2026-09-11', 'trained'], // Fri (planned)
      ]),
      MON_WED_FRI,
      2,
    ],
    [
      'with a schedule, an unlogged PLANNED day still breaks',
      entries([
        ['2026-09-15', 'trained'],
        // 09-14 Mon planned, unlogged → break
        ['2026-09-11', 'trained'],
      ]),
      MON_WED_FRI,
      1,
    ],
    [
      'a skipped day always breaks',
      entries([
        ['2026-09-15', 'trained'],
        ['2026-09-14', 'skipped'],
        ['2026-09-11', 'trained'],
      ]),
      MON_WED_FRI,
      1,
    ],
    [
      'rest days are neutral',
      entries([
        ['2026-09-15', 'rest'],
        ['2026-09-14', 'trained'],
      ]),
      null,
      1,
    ],
  ] as const)('%s', (_name, byDate, planned, expected) => {
    expect(streakFromEntries(byDate as Map<string, never>, planned as never, TODAY)).toBe(expected);
  });

  it('today may be blank without breaking the carry', () => {
    const byDate = entries([['2026-09-15', 'trained']]);
    expect(streakFromEntries(byDate as Map<string, never>, null, TODAY)).toBe(1);
  });
});

describe('findGaps', () => {
  it('returns unresolved planned days oldest-first, never today', () => {
    // Window 09-09..09-15: planned = Mon 14, Fri 11, Wed 09. Only 09-11 logged.
    const gaps = findGaps(new Set(['2026-09-11']), MON_WED_FRI, TODAY);
    expect(gaps).toEqual(['2026-09-09', '2026-09-14']);
  });

  it('no schedule → no gaps to ask about', () => {
    expect(findGaps(new Set(), null, TODAY)).toEqual([]);
    expect(findGaps(new Set(), [], TODAY)).toEqual([]);
  });

  it('fully logged window → empty', () => {
    const gaps = findGaps(new Set(['2026-09-09', '2026-09-11', '2026-09-14']), MON_WED_FRI, TODAY);
    expect(gaps).toEqual([]);
  });
});
