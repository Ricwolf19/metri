import { describe, expect, it } from 'vitest';

import { planAutoMarks, type DayMark } from './auto-adherence';

// 2026-11-02 is a Monday. Expo weekdays: 2 = Mon, 4 = Wed, 6 = Fri.
const MWF = [2, 4, 6];

const trained: DayMark = { status: 'trained', skipReason: null, workoutLogId: null };
const autoMissed: DayMark = { status: 'skipped', skipReason: null, workoutLogId: null };

const plan = (today: string, marks: Record<string, DayMark> = {}, from = '2026-11-02') =>
  planAutoMarks({ plannedWeekdays: MWF, from, today, marks: new Map(Object.entries(marks)) });

describe('planAutoMarks', () => {
  it('marks a passed planned day with nothing logged as missed, and leaves unplanned days alone', () => {
    expect(plan('2026-11-05')).toEqual([
      { date: '2026-11-02', kind: 'missed' },
      { date: '2026-11-04', kind: 'missed' },
    ]);
  });

  it('never marks today, nor anything before the enrollment started', () => {
    expect(plan('2026-11-02')).toEqual([]);
    expect(plan('2026-11-05', {}, '2026-11-03')).toEqual([{ date: '2026-11-04', kind: 'missed' }]);
  });

  it('keeps every day the lifter already answered', () => {
    expect(
      plan('2026-11-05', {
        '2026-11-02': trained,
        '2026-11-04': { status: 'skipped', skipReason: 'sick', workoutLogId: null },
      }),
    ).toEqual([]);
  });

  it('a session on an unplanned day within two days makes up the planned day before it', () => {
    // Missed Monday, trained Tuesday: Monday was moved, not missed.
    expect(plan('2026-11-04', { '2026-11-03': trained })).toEqual([
      { date: '2026-11-02', kind: 'moved' },
    ]);
  });

  it('turns an automatic miss into "moved" once the make-up session happens', () => {
    expect(plan('2026-11-04', { '2026-11-02': autoMissed, '2026-11-03': trained })).toEqual([
      { date: '2026-11-02', kind: 'moved' },
    ]);
  });

  it('never rewrites a miss the lifter gave a reason for, or a legacy skip log', () => {
    expect(
      plan('2026-11-04', {
        '2026-11-02': { status: 'skipped', skipReason: 'busy', workoutLogId: null },
        '2026-11-03': trained,
      }),
    ).toEqual([]);
    expect(
      plan('2026-11-04', {
        '2026-11-02': { status: 'skipped', skipReason: null, workoutLogId: 'legacy' },
        '2026-11-03': trained,
      }),
    ).toEqual([]);
  });

  it('a make-up session counts once, for the nearest open planned day', () => {
    // Wed and Fri missed, Saturday trained: only Friday moved.
    expect(plan('2026-11-09', { '2026-11-02': trained, '2026-11-07': trained })).toEqual([
      { date: '2026-11-04', kind: 'missed' },
      { date: '2026-11-06', kind: 'moved' },
    ]);
  });

  it('gives up past the grace days: a session three days later moves nothing', () => {
    // Wednesday missed, Friday trained as planned, an extra Saturday session.
    expect(
      plan('2026-11-09', {
        '2026-11-02': trained,
        '2026-11-06': trained,
        '2026-11-07': trained,
      }),
    ).toEqual([{ date: '2026-11-04', kind: 'missed' }]);
  });

  it('a session on a planned day makes nothing up', () => {
    expect(plan('2026-11-05', { '2026-11-04': trained })).toEqual([
      { date: '2026-11-02', kind: 'missed' },
    ]);
  });

  it('judges an empty day only once: days before the bookmark stay as they are', () => {
    expect(
      planAutoMarks({
        plannedWeekdays: MWF,
        from: '2026-11-02',
        judgeFrom: '2026-11-05',
        today: '2026-11-07',
        marks: new Map(),
      }),
    ).toEqual([{ date: '2026-11-06', kind: 'missed' }]);
  });

  it('still lets an older automatic miss become "moved"', () => {
    expect(
      planAutoMarks({
        plannedWeekdays: MWF,
        from: '2026-11-02',
        judgeFrom: '2026-11-04',
        today: '2026-11-04',
        marks: new Map([
          ['2026-11-02', autoMissed],
          ['2026-11-03', trained],
        ]),
      }),
    ).toEqual([{ date: '2026-11-02', kind: 'moved' }]);
  });
});
