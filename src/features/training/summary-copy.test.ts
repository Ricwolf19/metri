import { describe, expect, it } from 'vitest';

import type { TFunction } from '@/i18n';

import type { SessionTop } from './session-report';
import {
  loggedSetText,
  setText,
  signedNumber,
  signedPercent,
  topExerciseNote,
} from './summary-copy';

const t = ((key: string, params?: Record<string, unknown>) =>
  params ? `${key}:${JSON.stringify(params)}` : key) as unknown as TFunction;

const top = (over: Partial<SessionTop>): SessionTop => ({
  exerciseId: 'squat',
  name: 'Back Squat',
  reason: 'volume',
  topKg: 120,
  topReps: 5,
  gain: null,
  volumeKg: 1800,
  ...over,
});

describe('signed numbers', () => {
  it('signs a change with the typographic minus, one decimal under ten percent', () => {
    expect(signedPercent(0.0421)).toBe('+4.2 %');
    expect(signedPercent(0.126)).toBe('+13 %');
    expect(signedPercent(-0.05)).toBe('−5 %');
    // A change that rounds away carries no sign.
    expect(signedPercent(0.0004)).toBe('0 %');
    expect(signedPercent(-0.0004)).toBe('0 %');
    expect(signedPercent(0)).toBe('0 %');
    expect(signedNumber(120)).toBe('+120');
    expect(signedNumber(-2.5)).toBe('−2.5');
    expect(signedNumber(0)).toBe('0');
  });
});

describe('topExerciseNote', () => {
  it('says why the exercise is the top one', () => {
    expect(topExerciseNote(top({ reason: 'progress', gain: 0.05 }), 'kg', t)).toBe(
      'training.topProgress:{"pct":"+5 %"}',
    );
    expect(topExerciseNote(top({ reason: 'record' }), 'kg', t)).toBe('training.topRecord');
    expect(topExerciseNote(top({}), 'lb', t)).toBe(
      'training.topVolume:{"volume":3968.5,"unit":"lb"}',
    );
  });
});

describe('set lines', () => {
  it('reads a set as the session rows do, effort in the session mode', () => {
    const set = { weightKg: 60, reps: 8, rir: 2, isFailure: false };
    expect(setText(set, 'kg')).toBe('60 kg × 8');
    expect(loggedSetText(set, 'kg', t, 'rir')).toBe('60 kg × 8 @ RIR 2');
    expect(loggedSetText(set, 'kg', t, 'simple')).toBe('60 kg × 8 @ training.effortHard');
    expect(loggedSetText({ ...set, rir: 0, isFailure: true }, 'kg', t, 'rir')).toBe(
      '60 kg × 8 @ training.failure',
    );
    expect(loggedSetText({ ...set, rir: null }, 'kg', t, 'rir')).toBe('60 kg × 8');
  });

  it('two dumbbells lead with the count, never mistaken for the reps', () => {
    expect(
      loggedSetText(
        {
          weightKg: 30,
          reps: 10,
          rir: null,
          isFailure: false,
          load: { kind: 'dumbbell', perHandKg: 30, hands: 2 },
        },
        'kg',
        t,
        'rir',
      ),
    ).toBe('2 × 30 kg × 10');
  });
});
