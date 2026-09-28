import { describe, expect, it } from 'vitest';

import type { TFunction } from '@/i18n';

import { dayDisplayName, routineDisplayName, targetLine } from './labels';

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
