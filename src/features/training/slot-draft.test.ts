import { describe, expect, it } from 'vitest';

import type { WeekConfig } from '@/db/schema';

import { isComplete, toFreshDraft, toValues, toWeekDraft, type WeekDraft } from './slot-draft';

const config = (over: Partial<WeekConfig> = {}): WeekConfig =>
  ({
    id: 'c1',
    workoutDayExerciseId: 's1',
    weekNumber: 1,
    sets: 3,
    reps: 8,
    repsMax: null,
    rirMin: 2,
    rirMax: 3,
    toFailure: false,
    restSeconds: null,
    intensityType: 'rir',
    intensityValue: null,
    setGroups: null,
    ...over,
  }) as WeekConfig;

const draft = (over: Partial<WeekDraft> = {}): WeekDraft => ({
  weekNumber: 1,
  sets: 3,
  reps: 8,
  repsMax: null,
  rirMin: 2,
  rirMax: 3,
  method: 'rir',
  intensityValue: null,
  restSeconds: 120,
  setGroups: null,
  ...over,
});

describe('toWeekDraft', () => {
  it('maps toFailure to the failure method regardless of intensityType', () => {
    expect(toWeekDraft(config({ toFailure: true }), 120).method).toBe('failure');
  });

  it('falls back to the slot rest when the week has none', () => {
    expect(toWeekDraft(config({ restSeconds: null }), 90).restSeconds).toBe(90);
    expect(toWeekDraft(config({ restSeconds: 180 }), 90).restSeconds).toBe(180);
  });
});

describe('toFreshDraft', () => {
  it('starts fully unset except rest, ignoring the DB defaults', () => {
    const fresh = toFreshDraft(config(), 150);
    expect(fresh.sets).toBeNull();
    expect(fresh.reps).toBeNull();
    expect(fresh.method).toBeNull();
    expect(fresh.restSeconds).toBe(150);
  });
});

describe('isComplete', () => {
  it.each<[string, WeekDraft, boolean]>([
    ['fresh draft', draft({ sets: null, reps: null, method: null }), false],
    ['no method', draft({ method: null }), false],
    ['rir without range', draft({ method: 'rir', rirMin: null }), false],
    ['rir with range', draft({ method: 'rir' }), true],
    ['failure needs nothing else', draft({ method: 'failure', rirMin: null, rirMax: null }), true],
    ['rpe without value', draft({ method: 'rpe', intensityValue: null }), false],
    ['rpe with value', draft({ method: 'rpe', intensityValue: 8 }), true],
  ])('%s → %s', (_name, w, expected) => {
    expect(isComplete(w)).toBe(expected);
  });
});

describe('toValues', () => {
  it('round-trips a failure draft with an intensity backing type', () => {
    const v = toValues(draft({ method: 'failure' }));
    expect(v.toFailure).toBe(true);
    expect(v.intensityType).toBe('rir');
    expect(v.rirMin).toBeNull();
    expect(v.intensityValue).toBeNull();
  });

  it('clears RIR fields under RPE and the value under RIR', () => {
    expect(toValues(draft({ method: 'rpe', intensityValue: 9 }))).toMatchObject({
      rirMin: null,
      rirMax: null,
      intensityType: 'rpe',
      intensityValue: 9,
    });
    expect(toValues(draft({ method: 'rir', intensityValue: 9 }))).toMatchObject({
      rirMin: 2,
      rirMax: 3,
      intensityValue: null,
    });
  });

  it('survives a draft → values → draft round trip', () => {
    const original = draft({ method: 'percentage', intensityValue: 75, restSeconds: 200 });
    const back = toWeekDraft(config({ ...toValues(original), setGroups: null }), 120);
    expect(back.method).toBe('percentage');
    expect(back.intensityValue).toBe(75);
    expect(back.restSeconds).toBe(200);
  });
});
