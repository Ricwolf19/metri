import { describe, expect, it } from 'vitest';

import {
  fractionalSets,
  muscleBalance,
  muscleFatigue,
  muscleStrength,
  setEffort,
  WEEKLY_SET_TARGET,
  type ExerciseMuscles,
  type LoadedSet,
  type MuscleIndex,
} from './muscle-load';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const NOW = Date.parse('2026-09-19T12:00:00Z');

const index = (entries: Record<string, ExerciseMuscles>): MuscleIndex =>
  new Map(Object.entries(entries));

const BENCH: ExerciseMuscles = {
  primary: ['chest'],
  secondary: ['triceps', 'front_delts'],
  category: 'chest',
};
const SQUAT: ExerciseMuscles = {
  primary: ['quads', 'glutes'],
  secondary: ['hamstrings'],
  category: 'legs',
};

const set = (over: Partial<LoadedSet> = {}): LoadedSet => ({
  exerciseId: 'bench',
  reps: 8,
  weightKg: 100,
  rir: 2,
  isFailure: false,
  at: NOW,
  ...over,
});

describe('setEffort', () => {
  it.each<[string, number | null, boolean, number]>([
    ['failure is maximal', 3, true, 1],
    ['RIR 0', 0, false, 1],
    ['RIR 2', 2, false, 0.7],
    ['RIR 4', 4, false, 0.4],
    ['unrecorded RIR sits mid-range', null, false, 0.7],
  ])('%s', (_, rir, failure, expected) => {
    expect(setEffort(rir, failure)).toBeCloseTo(expected, 5);
  });

  it('floors easy sets rather than zeroing them', () => {
    expect(setEffort(20, false)).toBe(0.2);
  });
});

describe('fractionalSets', () => {
  const idx = index({ bench: BENCH, squat: SQUAT });

  it('counts a primary mover as a full set and a secondary as half', () => {
    const totals = fractionalSets([set()], idx);
    expect(totals.chest).toBe(1);
    expect(totals.triceps).toBe(0.5);
    expect(totals.front_delts).toBe(0.5);
  });

  it('splits a full set to EACH primary muscle, not between them', () => {
    // A squat is a full working set for quads and for glutes alike.
    const totals = fractionalSets([set({ exerciseId: 'squat' })], idx);
    expect(totals.quads).toBe(1);
    expect(totals.glutes).toBe(1);
    expect(totals.hamstrings).toBe(0.5);
  });

  it('never double-counts a muscle listed as both primary and secondary', () => {
    const idx2 = index({
      odd: { primary: ['chest'], secondary: ['chest', 'triceps'], category: 'chest' },
    });
    expect(fractionalSets([set({ exerciseId: 'odd' })], idx2).chest).toBe(1);
  });

  it('falls back to the category when an exercise names no muscles', () => {
    const idx2 = index({ custom: { primary: null, secondary: null, category: 'arms' } });
    const totals = fractionalSets([set({ exerciseId: 'custom' })], idx2);
    expect(totals.biceps).toBe(1);
    expect(totals.triceps).toBe(1);
  });

  it('resolves pre-v5 spellings instead of dropping them', () => {
    const idx2 = index({
      legacy: { primary: ['quadriceps'], secondary: ['core'], category: 'legs' },
    });
    const totals = fractionalSets([set({ exerciseId: 'legacy' })], idx2);
    expect(totals.quads).toBe(1);
    expect(totals.abs).toBe(0.5);
  });

  it('ignores sets whose exercise is unknown', () => {
    expect(fractionalSets([set({ exerciseId: 'ghost' })], idx).chest).toBe(0);
  });

  it('reports every head, so untrained muscles are distinguishable from missing ones', () => {
    const totals = fractionalSets([], idx);
    expect(totals.calves).toBe(0);
    expect(Object.values(totals).every((v) => v === 0)).toBe(true);
  });
});

describe('muscleBalance', () => {
  const idx = index({ bench: BENCH });
  const byHead = (sets: LoadedSet[], weeks?: number) =>
    Object.fromEntries(muscleBalance(sets, idx, weeks).map((b) => [b.head, b]));

  it('flags a never-trained muscle as untrained, not merely low', () => {
    expect(byHead([]).chest.status).toBe('untrained');
  });

  it.each<[number, string]>([
    [WEEKLY_SET_TARGET.min - 1, 'low'],
    [WEEKLY_SET_TARGET.min, 'optimal'],
    [WEEKLY_SET_TARGET.max, 'optimal'],
    [WEEKLY_SET_TARGET.max + 1, 'high'],
  ])('%i weekly sets reads as %s', (count, status) => {
    const sets = Array.from({ length: count }, () => set());
    expect(byHead(sets).chest.status).toBe(status);
  });

  it('normalizes a multi-week window back to a weekly rate', () => {
    const sets = Array.from({ length: 40 }, () => set());
    // 40 sets over 4 weeks = 10/week = the bottom of the band, not "high".
    expect(byHead(sets, 4).chest).toMatchObject({ sets: 10, status: 'optimal' });
  });
});

describe('muscleFatigue', () => {
  const idx = index({ bench: BENCH });
  const chestOf = (sets: LoadedSet[]) =>
    muscleFatigue(sets, idx, NOW).find((f) => f.head === 'chest')!.index;

  it('is zero with no history', () => {
    expect(chestOf([])).toBe(0);
  });

  it('decays as the session recedes', () => {
    const fresh = chestOf([set({ at: NOW })]);
    const old = chestOf([set({ at: NOW - 3 * DAY })]);
    expect(old).toBeLessThan(fresh);
    expect(old).toBeGreaterThanOrEqual(0);
  });

  it('weights a set to failure above the same set left in reserve', () => {
    const hard = chestOf([set({ rir: 0 })]);
    const easy = chestOf([set({ rir: 4 })]);
    expect(hard).toBeGreaterThan(easy);
  });

  it('saturates at 1 rather than running away', () => {
    const sets = Array.from({ length: 60 }, () => set({ rir: 0 }));
    expect(chestOf(sets)).toBe(1);
  });

  it('recovers small muscles faster than large ones', () => {
    const idx2 = index({
      curl: { primary: ['biceps'], secondary: null, category: 'arms' },
      squat: SQUAT,
    });
    const at = NOW - 2 * DAY;
    const out = muscleFatigue(
      [set({ exerciseId: 'curl', at }), set({ exerciseId: 'squat', at })],
      idx2,
      NOW,
    );
    const biceps = out.find((f) => f.head === 'biceps')!.index;
    const quads = out.find((f) => f.head === 'quads')!.index;
    expect(biceps).toBeLessThan(quads);
  });
});

describe('muscleStrength', () => {
  const idx = index({ bench: BENCH });
  const chestOf = (sets: LoadedSet[]) =>
    muscleStrength(sets, idx, NOW).find((s) => s.head === 'chest')!;

  it('reports never-trained muscles as null rather than zero', () => {
    expect(chestOf([])).toMatchObject({ daysSince: null, bestE1rmKg: null });
  });

  it('counts whole days since the most recent set', () => {
    expect(chestOf([set({ at: NOW - 3 * DAY }), set({ at: NOW - 10 * DAY })]).daysSince).toBe(3);
  });

  it('keeps the best estimate, not the latest', () => {
    const best = chestOf([
      set({ weightKg: 100, reps: 5 }), // e1RM ≈ 116.7
      set({ weightKg: 80, reps: 5 }),
    ]).bestE1rmKg;
    expect(best).toBeCloseTo(116.7, 1);
  });

  it('ignores high-rep sets, where the Epley estimate stops being usable', () => {
    // 20 reps would extrapolate to a wildly optimistic 1RM.
    expect(chestOf([set({ weightKg: 60, reps: 20 })]).bestE1rmKg).toBeNull();
  });
});
