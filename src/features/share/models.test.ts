import { describe, expect, it } from 'vitest';

import type { TFunction } from '@/i18n';

import type { ExerciseSessionPoint } from '../training/exercise-trend';
import { exerciseShareModel, routineShareModel, sessionShareModel } from './models';

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
      summary: { volumeKg: 0, setCount: 0, durationSeconds: 0, prs: [], exercises: many },
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

const point = (at: number, topKg: number, reps: number, isPr = false): ExerciseSessionPoint => ({
  logId: String(at),
  at,
  topKg,
  e1rmKg: topKg * (1 + reps / 30),
  volumeKg: topKg * reps,
  sets: [{ weightKg: topKg, reps, e1rmKg: topKg * (1 + reps / 30) }],
  isPr,
});

describe('exerciseShareModel', () => {
  it('shows best set, best e1RM, record count, a sparkline and the last three sessions', () => {
    const points = [
      point(1, 100, 6, true),
      point(2, 100, 8),
      point(3, 102.5, 5, true),
      point(4, 100, 6),
    ];
    const model = exerciseShareModel({
      name: 'Bench Press',
      points,
      unit: 'kg',
      formatDate: (at) => `d${at}`,
      t,
    });
    expect(model.metrics?.map((m) => m.value)).toEqual(['102.5×5', '126.5 kg', '2']);
    expect(model.spark).toHaveLength(4);
    expect(model.lines).toEqual(['d4 · 100×6', 'd3 · 102.5×5', 'd2 · 100×8']);
  });
});

describe('routineShareModel', () => {
  it('lists every split with its exercises by name, never sets and reps', () => {
    const model = routineShareModel({
      programName: 'Foundations',
      phaseLine: 'Phase 1 · Week 2 of 12',
      days: [
        {
          name: 'Workout A',
          exercises: [
            { id: 'leg-press', name: 'Leg Press' },
            { id: 'lat-pulldown', name: 'Lat Pulldown' },
          ],
        },
      ],
      t,
    });
    expect(model.lines).toEqual(['Workout A · Leg Press · Lat Pulldown']);
    expect(model.rows).toBeUndefined();
  });
});
