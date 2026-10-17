import { describe, expect, it } from 'vitest';

import type { PlannedSlot } from '@/db/schema';

import { nextSetSummary, remainingSets, resolvedSets } from './rest-summary';

const slot = (
  id: string,
  name: string,
  groups: { sets: number; reps: number; repsMax?: number }[],
) =>
  ({
    slotId: id,
    exerciseId: `ex-${id}`,
    name,
    setGroups: groups.map((g) => ({ sets: g.sets, reps: g.reps, repsMax: g.repsMax })),
    restSeconds: 90,
    badges: [],
    alternativeExerciseIds: [],
  }) as unknown as PlannedSlot;

const planned = [
  slot('a', 'Bench press', [
    { sets: 1, reps: 5 },
    { sets: 2, reps: 8, repsMax: 10 },
  ]),
  slot('b', 'Incline press', [{ sets: 3, reps: 10 }]),
  slot('c', 'Fly', [{ sets: 2, reps: 12 }]),
];

describe('nextSetSummary', () => {
  it('stays on the same exercise while planned sets remain', () => {
    const next = nextSetSummary(planned, 'a', 1, () => 0);
    expect(next).toEqual({
      kind: 'same',
      slotId: 'a',
      exerciseId: 'ex-a',
      exerciseName: 'Bench press',
      setNumber: 2,
      setTotal: 3,
      reps: '8-10',
    });
  });

  it('moves to the next exercise once the current one is complete', () => {
    const next = nextSetSummary(planned, 'a', 3, () => 0);
    expect(next).toEqual({
      kind: 'next',
      slotId: 'b',
      exerciseId: 'ex-b',
      exerciseName: 'Incline press',
      setNumber: 1,
      setTotal: 3,
      reps: '10',
    });
  });

  it('skips exercises that are already complete and wraps to earlier ones', () => {
    const done: Record<string, number> = { 'ex-a': 1, 'ex-b': 3, 'ex-c': 2 };
    const next = nextSetSummary(planned, 'b', 3, (id) => done[id] ?? 0);
    expect(next).toEqual({
      kind: 'next',
      slotId: 'a',
      exerciseId: 'ex-a',
      exerciseName: 'Bench press',
      setNumber: 2,
      setTotal: 3,
      reps: '8-10',
    });
  });

  it('counts what `doneFor` hands it — a caller that includes warm-ups skips a planned set', () => {
    // Incline press has 3 planned sets and 1 working set done; a warm-up
    // counted as done would announce set 3 instead of set 2.
    const working = nextSetSummary(planned, 'a', 3, () => 1);
    const withWarmup = nextSetSummary(planned, 'a', 3, () => 2);
    expect(working).toMatchObject({ exerciseName: 'Incline press', setNumber: 2 });
    expect(withWarmup).toMatchObject({ exerciseName: 'Incline press', setNumber: 3 });
  });

  it('reports done when every planned set is logged', () => {
    const next = nextSetSummary(planned, 'c', 2, () => 3);
    expect(next).toEqual({ kind: 'done' });
  });

  it('reports the extra set position when logging beyond the plan', () => {
    const next = nextSetSummary(planned, 'c', 5, () => 3);
    expect(next).toEqual({ kind: 'done' });
  });
});

describe('skipped sets and exercises', () => {
  const skippedSet = { ...planned[1], skippedSets: [1] } as PlannedSlot;
  const skippedExercise = { ...planned[1], skipped: { at: 1 } } as PlannedSlot;

  it('a skipped set settles its row: paging and the set number move past it', () => {
    expect(resolvedSets(skippedSet, 1)).toBe(2);
    const next = nextSetSummary([planned[0], skippedSet, planned[2]], 'b', 1, () => 0);
    expect(next).toMatchObject({ kind: 'same', slotId: 'b', setNumber: 3, setTotal: 3 });
  });

  it('a skipped exercise is settled whole and never comes up as next', () => {
    expect(resolvedSets(skippedExercise, 0)).toBe(3);
    const next = nextSetSummary([planned[0], skippedExercise, planned[2]], 'a', 3, () => 0);
    expect(next).toMatchObject({ kind: 'next', slotId: 'c' });
  });

  it('remainingSets counts what is neither logged nor skipped', () => {
    const done: Record<string, number> = { 'ex-a': 3, 'ex-b': 1, 'ex-c': 0 };
    expect(remainingSets(planned, (id) => done[id] ?? 0)).toBe(4);
    expect(remainingSets([planned[0], skippedSet, skippedExercise], (id) => done[id] ?? 0)).toBe(1);
  });
});
