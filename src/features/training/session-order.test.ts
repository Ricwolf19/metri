import { describe, expect, it } from 'vitest';

import type { PlannedSlot } from '@/db/schema';

import { chronologyMove, mergeOrder, sessionOrder, slotState } from './session-order';

const slot = (id: string, sets = 3, extra: Partial<PlannedSlot> = {}): PlannedSlot => ({
  slotId: id,
  exerciseId: `ex-${id}`,
  name: id,
  setGroups: [{ sets, reps: 8 }],
  restSeconds: 90,
  badges: [],
  alternativeExerciseIds: [],
  ...extra,
});

const counts =
  (done: Record<string, number>) =>
  (exerciseId: string): number =>
    done[exerciseId.replace('ex-', '')] ?? 0;

describe('slotState', () => {
  it('reads untouched, partial and done from the logged sets', () => {
    expect(slotState(slot('a'), 0)).toBe('untouched');
    expect(slotState(slot('a'), 1)).toBe('partial');
    expect(slotState(slot('a'), 3)).toBe('done');
    expect(slotState(slot('a'), 4)).toBe('done');
  });

  it('is missed only when nothing was logged', () => {
    expect(slotState(slot('a', 3, { skipped: { at: 1 } }), 0)).toBe('missed');
    expect(slotState(slot('a', 3, { skippedSets: [0, 1, 2] }), 0)).toBe('missed');
    // A set logged before the skip keeps the exercise in place, in the partial tone.
    expect(slotState(slot('a', 3, { skipped: { at: 1 } }), 1)).toBe('partial');
    expect(slotState(slot('a', 3, { skippedSets: [2] }), 2)).toBe('partial');
  });

  it('counts a skipped row without a logged set as begun', () => {
    expect(slotState(slot('a', 3, { skippedSets: [0] }), 0)).toBe('partial');
  });
});

describe('sessionOrder', () => {
  it('drops missed exercises to the end and keeps everything else in place', () => {
    const planned = [
      slot('a'),
      slot('b', 3, { skipped: { at: 1 } }),
      slot('c', 3, { skipped: { at: 1 } }),
      slot('d'),
    ];
    const { active, missed } = sessionOrder(planned, counts({ c: 1 }));
    expect(active.map((p) => p.slotId)).toEqual(['a', 'c', 'd']);
    expect(missed.map((p) => p.slotId)).toEqual(['b']);
  });
});

describe('mergeOrder', () => {
  it('reorders the active slots around missed ones that hold their positions', () => {
    expect(mergeOrder(['a', 'b', 'c', 'd'], new Set(['b']), ['d', 'a', 'c'])).toEqual([
      'd',
      'b',
      'a',
      'c',
    ]);
  });
});

describe('chronologyMove', () => {
  const planned = [slot('a'), slot('b'), slot('c'), slot('d')];

  it('moves a first set ahead of the earlier exercises not yet begun', () => {
    expect(chronologyMove(planned, 'd', counts({ a: 3 }))).toEqual(['a', 'd', 'b', 'c']);
  });

  it('leaves the order alone when everything before it has begun', () => {
    expect(chronologyMove(planned, 'c', counts({ a: 3, b: 1 }))).toBeNull();
    expect(chronologyMove(planned, 'a', counts({}))).toBeNull();
  });

  it('never moves an exercise that is already under way', () => {
    expect(chronologyMove(planned, 'd', counts({ d: 1 }))).toBeNull();
  });
});
