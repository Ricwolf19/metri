import { describe, expect, it } from 'vitest';

import type { TFunction } from '@/i18n';

import {
  bumpAnnouncement,
  effortChipLabel,
  effortPhrase,
  loggedSetLabel,
  setLoggedAnnouncement,
  trendPhrase,
} from './session-a11y';

// Renders key + vars, so the assertion reads what the screen reader is handed.
const t: TFunction = (key, vars) =>
  vars
    ? `${key}(${Object.entries(vars)
        .map(([k, v]) => `${k}=${v}`)
        .join(' ')})`
    : key;

describe('effort', () => {
  it('failure wins over a recorded RIR', () => {
    expect(effortPhrase({ rir: 0, failure: true }, t)).toBe('training.failure');
  });

  it('a RIR reads as reps in reserve, zero included', () => {
    expect(effortPhrase({ rir: 2, failure: false }, t)).toBe('2 training.effortRir');
    expect(effortPhrase({ rir: 0, failure: false }, t)).toBe('0 training.effortRir');
  });

  it('no effort says nothing', () => {
    expect(effortPhrase(null, t)).toBeNull();
    expect(effortPhrase({ rir: null, failure: false }, t)).toBeNull();
  });

  // The chip used to read only "How hard was that set?", hiding the value it holds.
  it('the chip label carries the value, or says it is not set', () => {
    expect(effortChipLabel({ rir: 3, failure: false }, t)).toBe(
      'training.effortValue(value=3 training.effortRir)',
    );
    expect(effortChipLabel(null, t)).toBe('training.effortValue(value=training.effortUnset)');
  });
});

describe('trendPhrase', () => {
  it('names up and down, and nothing for same or no history', () => {
    expect(trendPhrase('up', t)).toBe('training.aboveLast');
    expect(trendPhrase('down', t)).toBe('training.belowLast');
    expect(trendPhrase('same', t)).toBeNull();
    expect(trendPhrase(null, t)).toBeNull();
  });
});

describe('logged set', () => {
  const set = { n: 2, weight: '60', unit: 'kg', reps: 8 };

  it('reads number, weight and reps as one sentence', () => {
    expect(loggedSetLabel(set, t)).toBe('training.loggedSetA11y(n=2 weight=60 kg reps=8)');
  });

  it('appends the effort when the set has one', () => {
    expect(loggedSetLabel({ ...set, effort: { rir: 1, failure: false } }, t)).toBe(
      'training.loggedSetA11y(n=2 weight=60 kg reps=8), 1 training.effortRir',
    );
  });

  // Same order as the row draws it, so the count is never heard as the reps.
  it('two dumbbells put the count first', () => {
    expect(loggedSetLabel({ ...set, weight: '30', twoDumbbells: true }, t)).toBe(
      'training.loggedSetA11y(n=2 weight=2 × 30 kg reps=8)',
    );
  });

  it('the announcement after the check names the set it wrote', () => {
    expect(setLoggedAnnouncement({ ...set, unit: 'lb', weight: '135' }, t)).toBe(
      'training.setLoggedA11y(n=2 weight=135 lb reps=8)',
    );
  });
});

describe('bumpAnnouncement', () => {
  it('weight carries its unit, reps do not', () => {
    expect(bumpAnnouncement('weight', '62.5', 'kg', t)).toBe('training.weight: 62.5 kg');
    expect(bumpAnnouncement('reps', '9', 'kg', t)).toBe('training.reps: 9');
  });
});
