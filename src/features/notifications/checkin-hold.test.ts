import { describe, expect, it, vi } from 'vitest';

import { planCheckinAfterSession, planHeldCheckin, type SessionEnd } from './checkin-hold';

// session-state reads MMKV at call time only; the constant is all this needs.
vi.mock('@/lib/storage', () => ({ SettingKeys: {}, storage: {} }));

const MIN = 60_000;
// Local wall times, so the day keys hold in any timezone.
const at = (d: number, h: number, m = 0) => new Date(2026, 8, d, h, m).getTime();
// 2026-09-26 is a Saturday (expo weekday 7).
const SAT = '2026-09-26';

const end = (over: Partial<SessionEnd>): SessionEnd => ({
  startedAt: at(26, 18),
  endedAt: at(26, 19, 15),
  delayMinutes: 180,
  enabled: true,
  masterEnabled: true,
  dayResolved: false,
  ...over,
});

describe('planCheckinAfterSession', () => {
  it('asks once at end + the configured delay', () => {
    expect(planCheckinAfterSession(end({}))).toEqual({ day: SAT, askAt: at(26, 22, 15) });
  });

  it('asks nothing with the master switch or the event off', () => {
    expect(planCheckinAfterSession(end({ masterEnabled: false }))).toBeNull();
    expect(planCheckinAfterSession(end({ enabled: false }))).toBeNull();
  });

  it('keeps the planned check-in held but asks nothing once the day is answered', () => {
    expect(planCheckinAfterSession(end({ dayResolved: true }))).toEqual({
      day: SAT,
      askAt: null,
    });
  });

  it('rolls a late session past midnight while the hold stays on the start day', () => {
    const plan = planCheckinAfterSession(
      end({ startedAt: at(26, 22), endedAt: at(26, 23, 30), delayMinutes: 60 }),
    );
    expect(plan).toEqual({ day: SAT, askAt: at(27, 0, 30) });
  });

  it('drops the hold for an orphan found hours later', () => {
    expect(planCheckinAfterSession(end({ endedAt: at(26, 18) + 5 * 60 * MIN }))).toBeNull();
  });
});

describe('planHeldCheckin', () => {
  // Wed 18:00 and Sat 18:00 sessions; the check-in lands 3h after each.
  const entries = [
    { weekday: 4, hour: 18, minute: 0 },
    { weekday: 7, hour: 18, minute: 0 },
  ];

  it('holds back the session day and stands in for next week with a one-shot', () => {
    const plan = planHeldCheckin({
      entries,
      offsetMinutes: 180,
      hold: { day: SAT, askAt: null },
      now: at(26, 18, 30),
    });
    expect(plan).toEqual({
      expired: false,
      weekly: [{ weekday: 4, hour: 21, minute: 0 }],
      once: [at(26 + 7, 21)],
    });
  });

  it('adds the session-anchored ask before next week’s stand-in', () => {
    const plan = planHeldCheckin({
      entries,
      offsetMinutes: 180,
      hold: { day: SAT, askAt: at(26, 22, 15) },
      now: at(26, 19, 15),
    });
    expect(plan.expired).toBe(false);
    if (!plan.expired) expect(plan.once).toEqual([at(26, 22, 15), at(33, 21)]);
  });

  it('stays in force until the later of the planned moment and the ask', () => {
    const hold = { day: SAT, askAt: at(26, 23) };
    expect(planHeldCheckin({ entries, offsetMinutes: 180, hold, now: at(26, 22) }).expired).toBe(
      false,
    );
    expect(planHeldCheckin({ entries, offsetMinutes: 180, hold, now: at(26, 23) }).expired).toBe(
      true,
    );
  });

  it('on an unplanned day only the session-anchored ask is added', () => {
    // 2026-09-27 is a Sunday (weekday 1): nothing planned to hold back.
    const plan = planHeldCheckin({
      entries,
      offsetMinutes: 180,
      hold: { day: '2026-09-27', askAt: at(27, 14) },
      now: at(27, 11),
    });
    expect(plan).toEqual({
      expired: false,
      weekly: [
        { weekday: 4, hour: 21, minute: 0 },
        { weekday: 7, hour: 21, minute: 0 },
      ],
      once: [at(27, 14)],
    });
  });

  it('expires at once when nothing is held and nothing is asked', () => {
    const plan = planHeldCheckin({
      entries,
      offsetMinutes: 180,
      hold: { day: '2026-09-27', askAt: null },
      now: at(27, 11),
    });
    expect(plan).toEqual({ expired: true });
  });

  it('expires a hold it cannot read instead of holding the day forever', () => {
    const bad = { day: 'garbage', askAt: null } as const;
    expect(planHeldCheckin({ entries, offsetMinutes: 180, hold: bad, now: at(26, 11) })).toEqual({
      expired: true,
    });
  });
});
