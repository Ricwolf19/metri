import { describe, expect, it } from 'vitest';

import type { TFunction } from '@/i18n';

import type { SessionSummary } from '../training/session.repo';
import { sessionShareModel } from './models';

// The card copy is the key plus its params: what the model asked for is what is asserted.
const t = ((key: string, params?: Record<string, unknown>) =>
  params ? `${key}:${JSON.stringify(params)}` : key) as unknown as TFunction;

const exercise = (id: string, name: string, topKg: number, topReps: number, isPr = false) => ({
  exerciseId: id,
  name,
  topKg,
  topReps,
  isPr,
});

const summary = (over: Partial<SessionSummary>): SessionSummary => ({
  volumeKg: 0,
  setCount: 0,
  durationSeconds: 0,
  missedSets: 0,
  prs: [],
  exercises: [],
  plannedSets: 0,
  top: null,
  ...over,
});

describe('sessionShareModel', () => {
  it('turns the summary into the top set per exercise and a star on records', () => {
    const model = sessionShareModel({
      summary: summary({
        volumeKg: 5400,
        setCount: 18,
        durationSeconds: 3660,
        prs: ['Bench'],
        exercises: [
          exercise('barbell-bench-press', 'Bench Press', 100, 6, true),
          exercise('u1-custom', 'Zercher Squat', 120, 5),
        ],
      }),
      splitName: 'Side A',
      programLine: 'Foundations · Week 3',
      unit: 'kg',
      t,
    });
    expect(model.title).toBe('Side A');
    expect(model.subtitle).toBe('Foundations · Week 3');
    expect(model.rows).toEqual([
      { name: 'Bench Press', detail: '100×6 kg', pr: true },
      { name: 'Zercher Squat', detail: '120×5 kg', pr: false },
    ]);
    expect(model.lines).toEqual([]);
  });

  it('carries the four stats: duration, volume, sets and how many records', () => {
    const model = sessionShareModel({
      summary: summary({
        volumeKg: 5400,
        setCount: 18,
        durationSeconds: 3660,
        exercises: [
          exercise('a', 'A', 100, 6, true),
          exercise('b', 'B', 80, 8, true),
          exercise('c', 'C', 40, 12),
        ],
      }),
      splitName: 'Side A',
      programLine: null,
      unit: 'kg',
      t,
    });
    expect(model.metrics).toEqual([
      { label: 'share.duration', value: '1h 01m' },
      { label: 'share.volume', value: '5400 kg' },
      { label: 'share.sets', value: '18' },
      { label: 'share.prs', value: '2' },
    ]);
  });

  it('heads the card with the top exercise and why it is the top one', () => {
    const model = sessionShareModel({
      summary: summary({
        exercises: [exercise('squat', 'Back Squat', 120, 5)],
        top: {
          exerciseId: 'squat',
          name: 'Back Squat',
          reason: 'progress',
          topKg: 120,
          topReps: 5,
          gain: 0.042,
          volumeKg: 1800,
        },
      }),
      splitName: 'Legs',
      programLine: null,
      unit: 'kg',
      t,
    });
    expect(model.highlight).toEqual({
      label: 'share.top',
      title: 'Back Squat',
      detail: '120×5 kg',
      note: 'training.topProgress:{"pct":"+4.2 %"}',
    });
  });

  it('draws no highlight for a session with nothing logged', () => {
    const model = sessionShareModel({
      summary: summary({}),
      splitName: 'Legs',
      programLine: null,
      unit: 'kg',
      t,
    });
    expect(model.highlight).toBeUndefined();
  });

  it('caps the rows at eight and says how many more there were', () => {
    const many = Array.from({ length: 11 }, (_, i) => exercise(`e${i}`, `Exercise ${i}`, 50, 10));
    const model = sessionShareModel({
      summary: summary({ exercises: many }),
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
