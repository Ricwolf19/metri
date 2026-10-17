import { describe, expect, it } from 'vitest';

import {
  bumpValue,
  compareToPrevious,
  nextSetPrefill,
  previousSetFor,
  weightText,
} from './set-prefill';

describe('bumpValue', () => {
  it('adds the step without rounding to a plate increment', () => {
    expect(bumpValue(60, 2.5)).toBe('62.5');
    expect(bumpValue(0, 1.25)).toBe('1.25');
  });

  it('keeps typed decimals exactly (no silent 1-decimal rounding)', () => {
    expect(bumpValue(12.34, 0)).toBe('12.34');
    expect(bumpValue(100, -2.25)).toBe('97.75');
  });

  it('clamps at zero instead of going negative', () => {
    expect(bumpValue(1, -5)).toBe('0');
  });

  it('guards against float artifacts', () => {
    expect(bumpValue(0.1, 0.2)).toBe('0.3');
  });
});

describe('weightText', () => {
  it('keeps kg as-is with decimals', () => {
    expect(weightText(62.5, 'kg')).toBe('62.5');
  });

  it('converts to lb at the nearest half: the number that goes on the bar', () => {
    // 60 kg = 132.28 lb → 132.5.
    expect(weightText(60, 'lb')).toBe('132.5');
    expect(weightText(22.75, 'kg')).toBe('23');
  });
});

describe('nextSetPrefill', () => {
  const previous = [
    { weightKg: 80, reps: 10 },
    {
      weightKg: 77.5,
      reps: 9,
      load: { kind: 'barbell' as const, barKg: 20, platesKg: [25, 2.5, 1.25] },
    },
    { weightKg: 75, reps: 8 },
  ];
  const plates = { kind: 'barbell' as const, barKg: 20, platesKg: [25, 25] };

  it('seeds set 1 from set 1 of the previous session, weight AND reps', () => {
    const fill = nextSetPrefill({
      index: 0,
      planReps: 12,
      prevPlanReps: undefined,
      previous,
      logged: [],
      suggestedKg: 90,
    });
    expect(fill).toEqual({ weightKg: 80, reps: 10, load: null });
  });

  it('seeds every later set from the set just logged here, extra rep and plates included', () => {
    const fill = nextSetPrefill({
      index: 1,
      planReps: 12,
      prevPlanReps: 12,
      previous,
      logged: [{ weightKg: 82.5, reps: 13, load: plates }],
      suggestedKg: 90,
    });
    expect(fill).toEqual({ weightKg: 82.5, reps: 13, load: plates });
  });

  it('takes the plan reps on a pyramid step (8-6-4) but keeps the weight just logged', () => {
    const fill = nextSetPrefill({
      index: 1,
      planReps: 6,
      prevPlanReps: 8,
      previous,
      logged: [{ weightKg: 100, reps: 8, load: null }],
      suggestedKg: null,
    });
    expect(fill).toEqual({ weightKg: 100, reps: 6, load: null });
  });

  it("falls back to the previous session's same set, then its last, with nothing logged", () => {
    expect(
      nextSetPrefill({
        index: 1,
        planReps: 12,
        prevPlanReps: 12,
        previous,
        logged: [],
        suggestedKg: null,
      }),
    ).toEqual({ weightKg: 77.5, reps: 9, load: previous[1].load });
    expect(
      nextSetPrefill({
        index: 5,
        planReps: 12,
        prevPlanReps: 12,
        previous,
        logged: [],
        suggestedKg: null,
      }),
    ).toMatchObject({ weightKg: 75, reps: 8 });
  });

  it('falls back to the suggestion, then to a plain 8-rep row', () => {
    expect(
      nextSetPrefill({
        index: 0,
        planReps: 5,
        prevPlanReps: undefined,
        previous: [],
        logged: [],
        suggestedKg: 90,
      }),
    ).toEqual({ weightKg: 90, reps: 5, load: null });
    expect(
      nextSetPrefill({
        index: 0,
        planReps: undefined,
        prevPlanReps: undefined,
        previous: [],
        logged: [],
        suggestedKg: null,
      }),
    ).toEqual({ weightKg: null, reps: 8, load: null });
  });
});

describe('previousSetFor', () => {
  const previous = [
    { weightKg: 80, reps: 10 },
    { weightKg: 75, reps: 8 },
  ];

  it('is the same ordinal, else the last set, else nothing', () => {
    expect(previousSetFor(previous, 0)).toBe(previous[0]);
    expect(previousSetFor(previous, 7)).toBe(previous[1]);
    expect(previousSetFor([], 0)).toBeNull();
  });
});

describe('compareToPrevious', () => {
  it('reads up, down and same within the tolerance', () => {
    expect(compareToPrevious(82.5, 80)).toBe('up');
    expect(compareToPrevious(77.5, 80)).toBe('down');
    expect(compareToPrevious(80.01, 80, 0.02)).toBe('same');
    expect(compareToPrevious(8, 8)).toBe('same');
  });

  it('is null while either side is unknown', () => {
    expect(compareToPrevious(null, 80)).toBeNull();
    expect(compareToPrevious(80, null)).toBeNull();
  });
});
