import { describe, expect, it } from 'vitest';

import type { LoggedSet } from './day-events';
import { buildTimeline, formatRest } from './session-timeline';

const set = (setNumber: number, loggedAt: number): LoggedSet => ({
  setNumber,
  weightKg: 60,
  reps: 8,
  rir: null,
  rpe: null,
  isFailure: false,
  loggedAt,
});

describe('buildTimeline', () => {
  it('interleaves exercises by log time (a superset reads as it ran)', () => {
    const entries = buildTimeline([
      { exerciseId: 'bench', name: 'Bench', sets: [set(1, 0), set(2, 200_000)] },
      { exerciseId: 'row', name: 'Row', sets: [set(1, 100_000), set(2, 300_000)] },
    ]);
    expect(entries.map((e) => `${e.exerciseId}-${e.setNumber}`)).toEqual([
      'bench-1',
      'row-1',
      'bench-2',
      'row-2',
    ]);
  });

  it('measures the rest actually taken since the previous set', () => {
    const entries = buildTimeline([
      { exerciseId: 'squat', name: 'Squat', sets: [set(1, 0), set(2, 125_000)] },
    ]);
    expect(entries.map((e) => e.restSeconds)).toEqual([null, 125]);
  });

  it('is empty for a session with no sets', () => {
    expect(buildTimeline([{ exerciseId: 'x', name: 'X', sets: [] }])).toEqual([]);
  });
});

describe('formatRest', () => {
  it('pads seconds', () => {
    expect(formatRest(125)).toBe('2:05');
    expect(formatRest(59)).toBe('0:59');
  });
});
