import { describe, expect, it } from 'vitest';

import {
  EXERCISE_CHANGE_ALLOWANCE_SECONDS,
  LEAD_IN_ALLOWANCE_SECONDS,
  SET_CHANGE_ALLOWANCE_SECONDS,
  SET_WORK_SECONDS,
  WRAP_UP_ALLOWANCE_SECONDS,
  sessionTiming,
  type TimedSet,
} from './session-timing';

const T = 1_700_000_000_000;
const at = (seconds: number) => T + seconds * 1000;
const set = (exerciseId: string, seconds: number, restBeforeSeconds: number | null = null) =>
  ({ exerciseId, loggedAt: at(seconds), restBeforeSeconds }) satisfies TimedSet;
const REST: Record<string, number> = { bench: 120, squat: 180 };
const plannedRestFor = (id: string) => REST[id] ?? 120;

const timing = (sets: TimedSet[], end: number) =>
  sessionTiming({ startedAt: T, endedAt: at(end), sets, plannedRestFor })!;

describe('sessionTiming', () => {
  it('a session with every rest timed and nothing wasted is on pace', () => {
    const result = timing(
      [
        set('bench', 480),
        set('bench', 660, 120),
        set('bench', 840, 130),
        set('squat', 1140, 150),
        set('squat', 1360, 175),
      ],
      1400,
    );
    expect(result.reliable).toBe(true);
    expect(result.totalSeconds).toBe(1400);
    expect(result.leadInSeconds).toBe(480);
    expect(result.liftingSeconds).toBe(5 * SET_WORK_SECONDS);
    expect(result.restSeconds).toBe(120 + 130 + 150 + 175);
    expect(result.idleSeconds).toBe(0);
    expect(result.liftingSeconds + result.restSeconds + result.setupSeconds).toBe(1400);
    expect(result.verdict).toBe('onPace');
    expect(result.longestPause).toBeNull();
    // Rests follow the exercise just done: three after bench (120), one after squat (180).
    expect(result.rest).toEqual({
      takenSeconds: Math.round((120 + 130 + 150 + 175) / 4),
      plannedSeconds: Math.round((120 + 120 + 120 + 180) / 4),
      measured: 4,
      versus: 'onPlan',
    });
  });

  it('a long stall between sets is idle time, and the longest pause names the set it held up', () => {
    const result = timing(
      [
        set('bench', 300),
        set('bench', 480, 120),
        // 20 minutes on the phone, with a 2 min rest called over at the start of it.
        set('bench', 1680, 120),
        set('squat', 1950, 160),
      ],
      2000,
    );
    const stall = 1200 - SET_WORK_SECONDS - 120 - SET_CHANGE_ALLOWANCE_SECONDS;
    expect(result.idleSeconds).toBe(stall);
    expect(result.longestPause).toEqual({ exerciseId: 'bench', setNumber: 3, seconds: stall });
    expect(result.idleShare).toBeGreaterThan(0.3);
    expect(result.verdict).toBe('lotsIdle');
  });

  it('a share between the two thresholds is some idle time', () => {
    const result = timing(
      [set('bench', 300), set('bench', 480, 120), set('bench', 1000, 120), set('bench', 1180, 120)],
      1200,
    );
    expect(result.idleShare).toBeGreaterThanOrEqual(0.15);
    expect(result.idleShare).toBeLessThanOrEqual(0.3);
    expect(result.verdict).toBe('someIdle');
  });

  it('moving onto another exercise gets a bigger allowance than a set of the same one', () => {
    const between = timing([set('bench', 60), set('squat', 340, 60)], 340);
    const within = timing([set('bench', 60), set('bench', 340, 60)], 340);
    const left = 280 - SET_WORK_SECONDS - 60;
    expect(between.idleSeconds).toBe(Math.max(0, left - EXERCISE_CHANGE_ALLOWANCE_SECONDS));
    expect(within.idleSeconds).toBe(left - SET_CHANGE_ALLOWANCE_SECONDS);
  });

  it('without recorded rests (older sessions) the plan stands in for the rest, capped by the gap', () => {
    const result = timing([set('squat', 60), set('squat', 200), set('squat', 700)], 700);
    // 140 s gap: the 180 s plan cannot fit, so the gap minus the set is rest.
    // 500 s gap: 180 s of rest, the set allowance, the rest idle.
    expect(result.restSeconds).toBe(140 - SET_WORK_SECONDS + 180);
    expect(result.idleSeconds).toBe(500 - SET_WORK_SECONDS - 180 - SET_CHANGE_ALLOWANCE_SECONDS);
    expect(result.rest).toEqual({
      takenSeconds: null,
      plannedSeconds: 180,
      measured: 0,
      versus: null,
    });
  });

  it('a rest never ended runs into the next set: it reads as rest, longer than planned', () => {
    const result = timing(
      [set('bench', 120), set('bench', 520, 400), set('bench', 920, 400), set('bench', 1320, 400)],
      1320,
    );
    expect(result.idleSeconds).toBe(0);
    expect(result.rest?.takenSeconds).toBe(400 - SET_WORK_SECONDS);
    expect(result.rest?.versus).toBe('longer');
  });

  it('the warm-up before the first set is setup up to its allowance, idle past it', () => {
    const result = timing([set('bench', 25 * 60)], 25 * 60);
    expect(result.leadInSeconds).toBe(1500);
    expect(result.setupSeconds).toBe(LEAD_IN_ALLOWANCE_SECONDS);
    expect(result.idleSeconds).toBe(1500 - SET_WORK_SECONDS - LEAD_IN_ALLOWANCE_SECONDS);
    // One set is too little to judge a pace from, and there is no rest to compare.
    expect(result.verdict).toBeNull();
    expect(result.rest).toBeNull();
  });

  it('time after the last set is wrap-up up to its allowance, idle past it', () => {
    const result = timing([set('bench', 60)], 60 + 25 * 60);
    expect(result.idleSeconds).toBe(25 * 60 - WRAP_UP_ALLOWANCE_SECONDS);
    expect(result.longestPause).toBeNull();
  });

  it('is null with no working set', () => {
    expect(sessionTiming({ startedAt: T, endedAt: at(600), sets: [], plannedRestFor })).toBeNull();
  });

  it('reads the sets in the order they were logged, whatever order they arrive in', () => {
    const ordered = timing(
      [set('bench', 300), set('bench', 480, 120), set('squat', 800, 120)],
      800,
    );
    const shuffled = timing(
      [set('squat', 800, 120), set('bench', 300), set('bench', 480, 120)],
      800,
    );
    expect(shuffled).toEqual(ordered);
  });
});

describe('sessionTiming with sets logged in bursts', () => {
  /** Logged as they happen, two minutes of rest timed before each. */
  const steady = (count: number, from: number) =>
    Array.from({ length: count }, (_, i) => set('bench', from + i * 180, 130));

  it('a run of sets checked seconds apart makes the split unreliable: no verdict, no call-out', () => {
    // Four sets done without the phone, then checked off in one go.
    const result = timing(
      [
        ...steady(6, 300),
        set('squat', 2400, null),
        set('squat', 2405, null),
        set('squat', 2411, null),
        set('squat', 2416, null),
      ],
      2420,
    );
    expect(result.batchedSets).toBe(3);
    expect(result.reliable).toBe(false);
    expect(result.verdict).toBeNull();
    expect(result.longestPause).toBeNull();
    expect(result.totalSeconds).toBe(2420);
    // The rests that were timed still compare with the plan — the burst's own gaps do not.
    expect(result.rest).toMatchObject({ measured: 5, takenSeconds: 130, versus: 'onPlan' });
  });

  it('a rest timed at a few seconds is the logging, not a rest: the set still counts as batched', () => {
    // Each check starts a rest that the next check, seconds later, records.
    const result = timing(
      [...steady(3, 300), set('bench', 800, 135), set('bench', 812, 11), set('bench', 825, 12)],
      830,
    );
    // The burst's first set follows a real gap; the two after it are the burst.
    expect(result.batchedSets).toBe(2);
    expect(result.reliable).toBe(false);
  });

  it('a short gap after a real recorded rest is not a burst (a clock off between two devices)', () => {
    const result = timing([...steady(3, 300), set('bench', 675, 25)], 700);
    expect(result.batchedSets).toBe(0);
    expect(result.reliable).toBe(true);
  });

  it('one quick double check in a long session stays reliable', () => {
    const result = timing([...steady(9, 300), set('bench', 300 + 8 * 180 + 6, null)], 1800);
    expect(result.batchedSets).toBe(1);
    expect(result.reliable).toBe(true);
    expect(result.verdict).not.toBeNull();
  });
});
