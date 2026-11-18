import { describe, expect, it } from 'vitest';

import { planSessions, type PlanPhase } from './plan';

// Expo weekdays: 2 = Monday, 4 = Wednesday, 6 = Friday, 1 = Sunday.
const day = (id: string, weekday: number | null, orderIndex = 0) => ({
  id,
  name: id,
  orderIndex,
  weekday,
});

const phases: PlanPhase[] = [
  { id: 'p1', durationWeeks: 2, days: [day('A', 2, 0), day('B', 4, 1), day('C', 6, 2)] },
  { id: 'p2', durationWeeks: 4, days: [day('X', 3, 0), day('Y', 1, 1)] },
];

const dates = (out: ReturnType<typeof planSessions>) => out.map((s) => `${s.date} ${s.day.id}`);

describe('planSessions', () => {
  // 2026-11-17 is a Tuesday: Monday's split already passed this week.
  const base = { phases, today: '2026-11-17', startMinute: 18 * 60 };

  it('plans this week from today on, then rolls into the next phase when one runs out', () => {
    const out = planSessions({ ...base, currentPhaseId: 'p1', currentWeek: 2, weeks: 2 });
    expect(dates(out)).toEqual([
      '2026-11-18 B',
      '2026-11-20 C',
      // Week 2 of a 2-week phase was this one: next week is the next phase's.
      '2026-11-24 X',
      '2026-11-29 Y',
    ]);
    expect(out.every((s) => s.startMinute === 18 * 60)).toBe(true);
  });

  it('includes a split planned for today', () => {
    const out = planSessions({
      ...base,
      today: '2026-11-16',
      currentPhaseId: 'p1',
      currentWeek: 1,
      weeks: 1,
    });
    expect(dates(out)).toEqual(['2026-11-16 A', '2026-11-18 B', '2026-11-20 C']);
  });

  it('stops at the end of the program', () => {
    const out = planSessions({ ...base, currentPhaseId: 'p2', currentWeek: 4, weeks: 3 });
    expect(dates(out)).toEqual(['2026-11-17 X', '2026-11-22 Y']);
  });

  it('skips splits with no day and plans nothing for an unknown phase', () => {
    const loose: PlanPhase[] = [{ id: 'p', durationWeeks: 1, days: [day('A', null)] }];
    expect(
      planSessions({ ...base, phases: loose, currentPhaseId: 'p', currentWeek: 1, weeks: 2 }),
    ).toEqual([]);
    expect(planSessions({ ...base, currentPhaseId: 'gone', currentWeek: 1, weeks: 2 })).toEqual([]);
  });
});
