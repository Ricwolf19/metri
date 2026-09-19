import { describe, expect, it } from 'vitest';

import type { PlannedSlot } from '@/db/schema';

import { nextSetSummary } from './rest-summary';

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
      exerciseName: 'Bench press',
      setNumber: 2,
      setTotal: 3,
      reps: '8-10',
    });
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
