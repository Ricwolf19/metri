import { describe, expect, it } from 'vitest';

import { bumpValue, nextSetPrefill, weightText } from './set-prefill';

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

  it('converts to lb with 2 decimals so the load survives the round-trip', () => {
    // 60 kg = 132.28 lb; the lifter must see the load they actually lifted.
    expect(weightText(60, 'lb')).toBe('132.28');
  });
});

describe('nextSetPrefill', () => {
  const lastWeek = [{ weightKg: 80, reps: 8 }];

  it('prefills from the set just completed (same load for the back-off)', () => {
    const fill = nextSetPrefill({
      logged: [{ weightKg: 100, reps: 6 }],
      planReps: 8,
      lastWeek,
      suggestedKg: 90,
    });
    expect(fill).toEqual({ weightKg: 100, reps: 8 });
  });

  it('uses the logged set’s own reps when the plan defines none', () => {
    const fill = nextSetPrefill({
      logged: [{ weightKg: 40, reps: 12 }],
      planReps: undefined,
      lastWeek,
      suggestedKg: null,
    });
    expect(fill).toEqual({ weightKg: 40, reps: 12 });
  });

  it('falls back to last week before anything is logged', () => {
    const fill = nextSetPrefill({
      logged: [],
      planReps: 10,
      lastWeek,
      suggestedKg: 90,
    });
    expect(fill).toEqual({ weightKg: 80, reps: 10 });
  });

  it('falls back to the suggestion and a plain 8-rep row with no history', () => {
    const fill = nextSetPrefill({
      logged: [],
      planReps: undefined,
      lastWeek: [],
      suggestedKg: 60,
    });
    expect(fill).toEqual({ weightKg: 60, reps: 8 });
  });
});

describe('weightText (logged values)', () => {
  it('shows a quarter-kilo load exactly instead of rounding it to 1 decimal', () => {
    expect(weightText(22.75, 'kg')).toBe('22.75');
  });
});
