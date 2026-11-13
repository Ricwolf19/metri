import { describe, expect, it } from 'vitest';

import type { TFunction } from '@/i18n';

import {
  dayDisplayName,
  phaseMeta,
  routineDisplayName,
  scheduleLabel,
  setGroupLine,
  targetLine,
} from './labels';

// Captures the key + vars instead of translating — the mapping is the contract.
const t: TFunction = (key, vars) => `${key}:${vars?.n}`;

describe('display-name fallbacks', () => {
  it('a real name wins, trimmed', () => {
    expect(routineDisplayName({ name: '  Hipertrofia ', orderIndex: 0 }, t)).toBe('Hipertrofia');
    expect(dayDisplayName({ name: 'Push', orderIndex: 3 }, t)).toBe('Push');
  });

  // orderIndex is 0-based in the DB; the slug the user sees is 1-based.
  it.each([
    ['first phase', routineDisplayName, 0, 'editor.phaseFallback:1'],
    ['third phase', routineDisplayName, 2, 'editor.phaseFallback:3'],
    ['first split', dayDisplayName, 0, 'editor.splitFallback:1'],
  ] as const)('%s → %s', (_label, fn, orderIndex, expected) => {
    expect(fn({ name: '', orderIndex }, t)).toBe(expected);
    expect(fn({ name: '   ', orderIndex }, t)).toBe(expected);
  });
});

describe('targetLine', () => {
  // Renders key + vars, so the assertion reads what the lifter is told.
  const tt: TFunction = (key, vars) =>
    `${key}(${Object.entries(vars ?? {})
      .map(([k, v]) => `${k}=${v}`)
      .join(',')})`;

  it.each([
    [
      'fixed reps, no effort',
      { reps: 8, intensity: '', groupName: null },
      'training.target(reps=8)',
    ],
    [
      'a rep range',
      { reps: 8, repsMax: 10, intensity: '', groupName: null },
      'training.target(reps=8–10)',
    ],
    [
      'reps with a RIR target',
      { reps: 6, repsMax: 8, intensity: 'RIR 1-2', groupName: null },
      'training.targetEffort(reps=6–8,effort=RIR 1-2)',
    ],
    [
      'a top set leads with its group',
      { reps: 5, intensity: 'Failure', groupName: 'Top set' },
      'Top set · training.targetEffort(reps=5,effort=Failure)',
    ],
  ] as const)('%s', (_label, row, expected) => {
    expect(targetLine(row, tt)).toBe(expected);
  });
});

describe('plan read-outs', () => {
  // Renders key + vars, so the assertion reads what the lifter is told.
  const tt: TFunction = (key, vars) =>
    vars
      ? `${key}(${Object.entries(vars)
          .map(([k, v]) => `${k}=${v}`)
          .join(',')})`
      : key;

  it.each([
    ['one group, fixed reps', { sets: 3, reps: 8 }, null, '3 × 8'],
    [
      'a rep range with RIR',
      { sets: 3, reps: 8, repsMax: 10, rirMin: 2 },
      null,
      '3 × 8–10 · RIR 2',
    ],
    [
      'a named top set to failure',
      { sets: 1, reps: 6, toFailure: true },
      'Top set',
      'Top set · 1 × 6 · training.failure',
    ],
  ] as const)('setGroupLine: %s', (_label, group, name, expected) => {
    expect(setGroupLine(group, name, tt)).toBe(expected);
  });

  it('phaseMeta names the RM test week only when the phase has one', () => {
    expect(phaseMeta({ durationWeeks: 4, rmTestWeek: null }, tt)).toBe('training.weeks(count=4)');
    expect(phaseMeta({ durationWeeks: 4, rmTestWeek: 4 }, tt)).toBe(
      'training.weeks(count=4) · program.rmTestWeek(n=4)',
    );
  });

  it('scheduleLabel needs both a weekday and a time', () => {
    expect(scheduleLabel({ weekday: 2, startMinute: 18 * 60 }, tt, '24')).toBe(
      'weekday.mon · 18:00',
    );
    expect(scheduleLabel({ weekday: 2, startMinute: null }, tt, '24')).toBeNull();
    expect(scheduleLabel({ weekday: null, startMinute: 600 }, tt, '24')).toBeNull();
  });
});
