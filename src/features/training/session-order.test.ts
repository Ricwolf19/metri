import { describe, expect, it } from 'vitest';

import type { PlannedSlot } from '@/db/schema';

import {
  chronologyMove,
  mergeOrder,
  pendingElsewhere,
  sessionNext,
  sessionOrder,
  slotState,
} from './session-order';

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

describe('pendingElsewhere', () => {
  it('finds an exercise left with sets open', () => {
    const found = pendingElsewhere([slot('a'), slot('b')], 'b', counts({ a: 1 }));
    expect(found?.slot.slotId).toBe('a');
    expect(found?.open).toBe(2);
  });

  it('counts a skipped row as settled, not as open', () => {
    const planned = [slot('a', 3, { skippedSets: [2] }), slot('b')];
    expect(pendingElsewhere(planned, 'b', counts({ a: 2 }))).toBeNull();
    expect(pendingElsewhere(planned, 'b', counts({ a: 1 }))?.open).toBe(1);
  });

  it('ignores the exercise being logged, and exercises not begun or finished', () => {
    const planned = [slot('a'), slot('b'), slot('c')];
    expect(pendingElsewhere(planned, 'a', counts({ a: 1, b: 3 }))).toBeNull();
  });

  it('never holds a slot up on another slot of the same exercise', () => {
    const narrow = slot('a');
    const wide = { ...slot('b'), exerciseId: narrow.exerciseId };
    expect(pendingElsewhere([narrow, wide], 'a', counts({ a: 1 }))).toBeNull();
  });

  it('does not hold the lifter for an exercise skipped after a logged set', () => {
    const planned = [slot('a', 3, { skipped: { at: 1 } }), slot('b')];
    expect(pendingElsewhere(planned, 'b', counts({ a: 1 }))).toBeNull();
  });
});

describe('sessionNext', () => {
  const next = (planned: PlannedSlot[], done: Record<string, number>) => {
    const n = sessionNext(planned, counts(done));
    return n.kind === 'done' ? 'done' : `${n.slotId}:${n.setNumber}`;
  };

  it('follows the current order, so a reorder changes what is next', () => {
    expect(next([slot('a'), slot('b'), slot('c')], {})).toBe('a:1');
    expect(next([slot('c'), slot('a'), slot('b')], {})).toBe('c:1');
  });

  it('stays on an exercise under way even when one was moved ahead of it', () => {
    expect(next([slot('c'), slot('a'), slot('b')], { a: 1 })).toBe('a:2');
  });

  it('passes over settled exercises and ends when nothing is open', () => {
    expect(next([slot('a', 1), slot('b', 3, { skipped: { at: 1 } }), slot('c')], { a: 1 })).toBe(
      'c:1',
    );
    expect(next([slot('a', 1)], { a: 1 })).toBe('done');
  });
});
