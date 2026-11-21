import { describe, expect, it } from 'vitest';

import type { TFunction } from '@/i18n';

import {
  bumpAnnouncement,
  effortChipLabel,
  effortPhrase,
  loggedSetLabel,
  setLoggedAnnouncement,
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
    expect(effortPhrase({ rir: 0, failure: true }, t, 'rir')).toBe('training.failure');
  });

  it('a RIR reads as reps in reserve, zero included', () => {
    expect(effortPhrase({ rir: 2, failure: false }, t, 'rir')).toBe('2 training.effortRir');
    expect(effortPhrase({ rir: 0, failure: false }, t, 'rir')).toBe('0 training.effortRir');
  });

  // The sheet's open end is "5+": a 5 read as "5 in reserve" while the row drew "RIR 5+".
  it('the open end reads 5+, as the row draws it', () => {
    expect(effortPhrase({ rir: 5, failure: false }, t, 'rir')).toBe('5+ training.effortRir');
    expect(effortPhrase({ rir: 4, failure: false }, t, 'rir')).toBe('4 training.effortRir');
  });

  it('no effort says nothing', () => {
    expect(effortPhrase(null, t, 'rir')).toBeNull();
    expect(effortPhrase({ rir: null, failure: false }, t, 'rir')).toBeNull();
  });

  // The chip used to read only "How hard was that set?", hiding the value it holds.
  it('the chip label carries the value, or says it is not set', () => {
    expect(effortChipLabel({ rir: 3, failure: false }, t, 'rir')).toBe(
      'training.effortValue(value=3 training.effortRir)',
    );
    expect(effortChipLabel(null, t, 'rir')).toBe(
      'training.effortValue(value=training.effortUnset)',
    );
  });

  // Simple mode draws the band ("× 8 @ Hard"): the reader hears the same word.
  it('simple mode speaks the band the row draws', () => {
    expect(effortPhrase({ rir: 1, failure: false }, t, 'simple')).toBe('training.effortHard');
    expect(effortPhrase({ rir: 4, failure: false }, t, 'simple')).toBe('training.effortModerate');
    expect(effortPhrase({ rir: 5, failure: false }, t, 'simple')).toBe('training.effortEasy');
    expect(effortPhrase({ rir: 0, failure: true }, t, 'simple')).toBe('training.failure');
    expect(effortPhrase(null, t, 'simple')).toBeNull();
    expect(effortChipLabel({ rir: 3, failure: false }, t, 'simple')).toBe(
      'training.effortValue(value=training.effortModerate)',
    );
    expect(effortChipLabel(null, t, 'simple')).toBe(
      'training.effortValue(value=training.effortUnset)',
    );
  });

  it('free mode speaks the professional scale', () => {
    expect(effortPhrase({ rir: 2, failure: false }, t, 'free')).toBe('2 training.effortRir');
  });
});

describe('logged set', () => {
  const set = { n: 2, weight: '60', unit: 'kg', reps: 8 };

  it('reads number, weight and reps as one sentence', () => {
    expect(loggedSetLabel(set, t, 'rir')).toBe('training.loggedSetA11y(n=2 weight=60 kg reps=8)');
  });

  it('appends the effort when the set has one', () => {
    expect(loggedSetLabel({ ...set, effort: { rir: 1, failure: false } }, t, 'rir')).toBe(
      'training.loggedSetA11y(n=2 weight=60 kg reps=8), 1 training.effortRir',
    );
  });

  it('appends the band in simple mode', () => {
    expect(loggedSetLabel({ ...set, effort: { rir: 1, failure: false } }, t, 'simple')).toBe(
      'training.loggedSetA11y(n=2 weight=60 kg reps=8), training.effortHard',
    );
  });

  // Same order as the row draws it, so the count is never heard as the reps.
  it('two dumbbells put the count first', () => {
    expect(loggedSetLabel({ ...set, weight: '30', twoDumbbells: true }, t, 'rir')).toBe(
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
