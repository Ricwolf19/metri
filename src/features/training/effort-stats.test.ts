import { describe, expect, it } from 'vitest';

import {
  adherenceRate,
  averageRir,
  compareEffort,
  expandTargets,
  hardSetCount,
  sessionAdherence,
  type EffortSet,
  type EffortTarget,
} from './effort-stats';

import type { PlannedSlot, SetGroup } from '@/db/schema';

const set = (over: Partial<EffortSet> = {}): EffortSet => ({
  exerciseId: 'bench',
  rir: 2,
  isFailure: false,
  ...over,
});

const target = (over: Partial<EffortTarget> = {}): EffortTarget => ({
  exerciseId: 'bench',
  rirMin: 1,
  rirMax: 3,
  toFailure: false,
  ...over,
});

const slot = (exerciseId: string, groups: SetGroup[]): PlannedSlot => ({
  slotId: `${exerciseId}-slot`,
  exerciseId,
  name: exerciseId,
  setGroups: groups,
  restSeconds: 120,
  badges: [],
  alternativeExerciseIds: [],
});

describe('hardSetCount', () => {
  it('counts sets at or below RIR 2, plus anything taken to failure', () => {
    const sets = [
      set({ rir: 0 }),
      set({ rir: 2 }),
      set({ rir: 3 }),
      set({ rir: 5, isFailure: true }),
    ];
    expect(hardSetCount(sets)).toBe(3);
  });

  it('does not count an unrecorded set as hard', () => {
    expect(hardSetCount([set({ rir: null })])).toBe(0);
  });
});

describe('averageRir', () => {
  it('averages only recorded values', () => {
    expect(averageRir([set({ rir: 1 }), set({ rir: 4 }), set({ rir: null })])).toBe(2.5);
  });

  it('returns null rather than a misleading zero when nothing was recorded', () => {
    expect(averageRir([set({ rir: null })])).toBeNull();
    expect(averageRir([])).toBeNull();
  });
});

describe('compareEffort', () => {
  it.each<[string, EffortSet, EffortTarget, string]>([
    ['inside the range', set({ rir: 2 }), target(), 'on_target'],
    ['at the lower bound', set({ rir: 1 }), target(), 'on_target'],
    ['at the upper bound', set({ rir: 3 }), target(), 'on_target'],
    ['left too much in reserve', set({ rir: 5 }), target(), 'easy'],
    ['went past the prescription', set({ rir: 0 }), target(), 'hard'],
    ['failure counts as zero reps in reserve', set({ isFailure: true }), target(), 'hard'],
    [
      'failure when failure was asked for',
      set({ isFailure: true }),
      target({ toFailure: true }),
      'on_target',
    ],
    ['stopped short of a failure target', set({ rir: 2 }), target({ toFailure: true }), 'easy'],
    ['single-value target', set({ rir: 2 }), target({ rirMin: 2, rirMax: null }), 'on_target'],
  ])('%s', (_, s, t, expected) => {
    expect(compareEffort(s, t)).toBe(expected);
  });

  it.each<[string, EffortSet, EffortTarget | undefined]>([
    ['no target at all', set(), undefined],
    ['target prescribes no intensity', set(), target({ rirMin: null, rirMax: null })],
    ['set has no recorded RIR', set({ rir: null }), target()],
  ])('stays silent when %s', (_, s, t) => {
    expect(compareEffort(s, t)).toBe('unknown');
  });
});

describe('expandTargets', () => {
  it('produces one target per prescribed set, preserving group order', () => {
    const snapshot = [
      slot('bench', [
        { sets: 1, reps: 6, rirMin: 0, rirMax: 0 },
        { sets: 2, reps: 8, rirMin: 3, rirMax: 4 },
      ]),
    ];
    const targets = expandTargets(snapshot);
    expect(targets).toHaveLength(3);
    expect(targets[0].rirMax).toBe(0);
    expect(targets[2].rirMin).toBe(3);
  });

  it('handles a missing snapshot', () => {
    expect(expandTargets(null)).toEqual([]);
  });
});

describe('sessionAdherence', () => {
  const snapshot = [
    slot('bench', [{ sets: 2, reps: 8, rirMin: 1, rirMax: 3 }]),
    slot('row', [{ sets: 1, reps: 10, rirMin: 2, rirMax: 2 }]),
  ];

  it('scores each set against its own exercise queue, in order', () => {
    const result = sessionAdherence(snapshot, [
      set({ exerciseId: 'bench', rir: 2 }), // on target
      set({ exerciseId: 'bench', rir: 6 }), // too easy
      set({ exerciseId: 'row', rir: 0 }), // too hard
    ]);
    expect(result).toMatchObject({ on_target: 1, easy: 1, hard: 1, unknown: 0, total: 3 });
  });

  it('does not score extra sets beyond the plan', () => {
    const result = sessionAdherence(snapshot, [
      set({ exerciseId: 'bench', rir: 2 }),
      set({ exerciseId: 'bench', rir: 2 }),
      set({ exerciseId: 'bench', rir: 2 }), // third bench set was never prescribed
    ]);
    expect(result).toMatchObject({ on_target: 2, unknown: 1, total: 3 });
  });

  it('interleaving exercises does not consume another exercise’s targets', () => {
    const result = sessionAdherence(snapshot, [
      set({ exerciseId: 'row', rir: 2 }),
      set({ exerciseId: 'bench', rir: 2 }),
    ]);
    expect(result.on_target).toBe(2);
  });
});

describe('adherenceRate', () => {
  it('is the share of scored sets that hit the prescription', () => {
    expect(adherenceRate({ on_target: 3, easy: 1, hard: 0, unknown: 9, total: 13 })).toBe(75);
  });

  it('is null when nothing could be scored', () => {
    expect(adherenceRate({ on_target: 0, easy: 0, hard: 0, unknown: 4, total: 4 })).toBeNull();
  });
});
