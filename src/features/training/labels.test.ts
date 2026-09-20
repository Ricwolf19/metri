import { describe, expect, it } from 'vitest';

import type { TFunction } from '@/i18n';

import { dayDisplayName, routineDisplayName } from './labels';

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
