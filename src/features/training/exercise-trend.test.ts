import { describe, expect, it } from 'vitest';

import {
  activeExercises,
  bestSetOf,
  buildExerciseSeries,
  mostImproved,
  prEvents,
  weeklyTops,
  type ExerciseSessionPoint,
} from './exercise-trend';
import type { ExerciseSession } from './stats.repo';

const DAY = 86_400_000;
const NOW = new Date(2026, 9, 12).getTime();

const session = (
  logId: string,
  daysAgo: number,
  sets: [number, number, ExerciseSession['sets'][number]['load']?][],
): ExerciseSession => ({
  logId,
  completedAt: new Date(NOW - daysAgo * DAY),
  sets: sets.map(([weightKg, reps, load]) => ({ weightKg, reps, load: load ?? null })),
});

describe('buildExerciseSeries', () => {
  it('folds sessions oldest → newest into top, e1RM, volume and PR flags', () => {
    const points = buildExerciseSeries([
      session('b', 1, [
        [82.5, 5],
        [82.5, 5],
      ]),
      session('a', 8, [
        [80, 6],
        [80, 6],
      ]),
    ]);
    expect(points.map((p) => p.logId)).toEqual(['a', 'b']);
    expect(points[0]).toMatchObject({ topKg: 80, volumeKg: 960, isPr: true });
    expect(points[1]).toMatchObject({ topKg: 82.5, isPr: true });
    expect(points[1].e1rmKg).toBeCloseTo(82.5 * (1 + 5 / 30), 5);
  });

  it('refuses an e1RM for high-rep sets but still keeps their top and volume', () => {
    const [p] = buildExerciseSeries([
      session('a', 1, [
        [40, 15],
        [40, 15],
      ]),
    ]);
    expect(p.e1rmKg).toBeNull();
    expect(p.topKg).toBe(40);
    expect(p.volumeKg).toBe(1200);
  });

  it('counts two dumbbells in the volume while the PR stays per hand', () => {
    const load = { kind: 'dumbbell' as const, perHandKg: 30, hands: 2 as const };
    const [p] = buildExerciseSeries([session('a', 1, [[30, 10, load]])]);
    expect(p.volumeKg).toBe(600);
    expect(p.topKg).toBe(30);
  });

  it('flags a PR only when the top set beats EVERY earlier session', () => {
    const points = buildExerciseSeries([
      session('a', 10, [[100, 5]]),
      session('b', 7, [[95, 8]]),
      session('c', 4, [[100, 6]]),
      session('d', 1, [[102.5, 3]]),
    ]);
    expect(prEvents(points).map((p) => p.logId)).toEqual(['a', 'd']);
  });
});

describe('bestSetOf', () => {
  it('takes the heaviest set and, at equal weight, the one with more reps', () => {
    const points = buildExerciseSeries([
      session('a', 3, [
        [100, 5],
        [100, 8],
      ]),
      session('b', 1, [[95, 10]]),
    ]);
    expect(bestSetOf(points)).toMatchObject({ weightKg: 100, reps: 8 });
    expect(bestSetOf([])).toBeNull();
  });
});

const point = (at: number, e1rmKg: number | null): ExerciseSessionPoint => ({
  logId: String(at),
  at,
  topKg: e1rmKg ?? 0,
  e1rmKg,
  volumeKg: 0,
  sets: [],
  isPr: false,
});
const series = (...e1rms: (number | null)[]): ExerciseSessionPoint[] =>
  e1rms.map((v, i) => point(NOW - (e1rms.length - i) * 7 * DAY, v));

describe('mostImproved', () => {
  const opts = { windowDays: 90, minSessions: 4, now: NOW };

  it('ranks by the e1RM gain between the first two and the last two sessions', () => {
    const ranked = mostImproved(
      new Map([
        ['bench', series(100, 102, 104, 110, 112)],
        ['squat', series(140, 140, 150, 180)],
        ['curl', series(30, 30, 30, 30)],
      ]),
      opts,
    );
    expect(ranked.map((r) => r.exerciseId)).toEqual(['squat', 'bench']);
    expect(ranked[0]).toMatchObject({ firstE1rmKg: 140, lastE1rmKg: 180, deltaKg: 40 });
    expect(ranked[0].deltaPct).toBeCloseTo((40 / 140) * 100, 5);
  });

  it('needs enough rated sessions inside the window and ignores unrated ones', () => {
    expect(mostImproved(new Map([['bench', series(100, 110, 120)]]), opts)).toEqual([]);
    expect(mostImproved(new Map([['bench', series(100, null, 110, null, 120)]]), opts)).toEqual([]);
    const old = series(100, 110, 120, 130).map((p) => ({ ...p, at: p.at - 200 * DAY }));
    expect(mostImproved(new Map([['bench', old]]), opts)).toEqual([]);
  });

  it('drops an exercise that went backwards', () => {
    expect(mostImproved(new Map([['bench', series(120, 120, 110, 100)]]), opts)).toEqual([]);
  });
});

describe('activeExercises', () => {
  it('lists exercises trained in the window, most recent first, with their session count', () => {
    const active = activeExercises(
      new Map([
        ['bench', series(100, 100, 100)],
        ['squat', [point(NOW - 2 * DAY, 100)]],
        ['row', [point(NOW - 60 * DAY, 100)]],
      ]),
      { windowDays: 30, now: NOW },
    );
    expect(active.map((a) => [a.exerciseId, a.sessions])).toEqual([
      ['squat', 1],
      ['bench', 3],
    ]);
  });
});

describe('weeklyTops', () => {
  it('keeps the heaviest set per trained week, Monday-first, oldest first, capped', () => {
    // NOW is Monday 2026-10-12: 1 and 3 days ago sit in the previous week, 8 the one before.
    const points = buildExerciseSeries([
      session('a', 8, [[80, 5]]),
      session('b', 3, [[82.5, 5]]),
      session('c', 1, [[85, 3]]),
      session('d', 0, [[84, 5]]),
    ]);
    const weeks = weeklyTops(points, { weeks: 6 });
    expect(weeks.map((w) => [w.topKg, w.sessions])).toEqual([
      [80, 1],
      [85, 2],
      [84, 1],
    ]);
    expect(new Date(weeks[1].weekStart).getDay()).toBe(1);
    expect(weeklyTops(points, { weeks: 2 }).map((w) => w.topKg)).toEqual([85, 84]);
  });
});
