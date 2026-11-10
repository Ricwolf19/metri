import { describe, expect, it } from 'vitest';

import type { TFunction } from '@/i18n';

import { sessionShareModel } from './models';

// The card copy is the key plus its params: what the model asked for is what is asserted.
const t = ((key: string, params?: Record<string, unknown>) =>
  params ? `${key}:${JSON.stringify(params)}` : key) as unknown as TFunction;

describe('sessionShareModel', () => {
  const exercise = (id: string, name: string, topKg: number, topReps: number, isPr = false) => ({
    exerciseId: id,
    name,
    topKg,
    topReps,
    isPr,
  });

  it('turns the summary into codes with the top set per exercise and a star on records', () => {
    const model = sessionShareModel({
      summary: {
        volumeKg: 5400,
        setCount: 18,
        durationSeconds: 3660,
        missedSets: 0,
        prs: ['Bench'],
        exercises: [
          exercise('barbell-bench-press', 'Bench Press', 100, 6, true),
          exercise('u1-custom', 'Zercher Squat', 120, 5),
        ],
      },
      splitName: 'Side A',
      programLine: 'Foundations · Week 3',
      unit: 'kg',
      t,
    });
    expect(model.title).toBe('Side A');
    expect(model.subtitle).toBe('Foundations · Week 3');
    expect(model.metrics?.map((m) => m.value)).toEqual(['5400 kg', '18', '61m']);
    expect(model.rows).toEqual([
      { name: 'Bench Press', detail: '100×6 kg', pr: true },
      { name: 'Zercher Squat', detail: '120×5 kg', pr: false },
    ]);
    expect(model.lines).toEqual([]);
  });

  it('caps the rows at eight and says how many more there were', () => {
    const many = Array.from({ length: 11 }, (_, i) => exercise(`e${i}`, `Exercise ${i}`, 50, 10));
    const model = sessionShareModel({
      summary: {
        volumeKg: 0,
        setCount: 0,
        durationSeconds: 0,
        missedSets: 0,
        prs: [],
        exercises: many,
      },
      splitName: 'Full body',
      programLine: null,
      unit: 'lb',
      t,
    });
    expect(model.rows).toHaveLength(8);
    expect(model.lines).toEqual(['share.more:{"n":3}']);
    expect(model.subtitle).toBeUndefined();
  });
});
