import { describe, expect, it } from 'vitest';

import { parseLatestRelease } from './payload';

const VALID = {
  version: '1.14.0',
  tag: 'v1.14.0',
  runtimeVersion: 'abc123',
  apkUrl: 'https://github.com/Ricwolf19/metri/releases/download/metri-v1.12.0/metri-1.12.0.apk',
  sha256: 'f'.repeat(64),
  sizeBytes: 48_200_000,
  notes: '### Features\n\n- Update card',
  publishedAt: '2026-09-28T12:00:00.000Z',
  releaseUrl: 'https://github.com/Ricwolf19/metri/releases/tag/v1.14.0',
};

describe('parseLatestRelease', () => {
  it('accepts a well-formed payload', () => {
    expect(parseLatestRelease(VALID)).toEqual(VALID);
  });

  it('ignores extra fields', () => {
    expect(parseLatestRelease({ ...VALID, channel: 'beta', extra: { a: 1 } })).toEqual(VALID);
  });

  it('accepts empty notes and an empty runtime (the kind decision handles it)', () => {
    expect(parseLatestRelease({ ...VALID, notes: '', runtimeVersion: '' })).not.toBeNull();
  });

  it.each(Object.keys(VALID))('rejects a payload missing %s', (key) => {
    const rest: Record<string, unknown> = { ...VALID };
    delete rest[key];
    expect(parseLatestRelease(rest)).toBeNull();
  });

  it.each([
    ['version', 1.14],
    ['version', '  '],
    ['tag', null],
    ['runtimeVersion', 42],
    ['sha256', false],
    ['notes', ['a']],
    ['sizeBytes', '48200000'],
    ['sizeBytes', Number.NaN],
    ['sizeBytes', -1],
    ['publishedAt', 'yesterday'],
    ['apkUrl', 'http://insecure.example/metri.apk'],
    ['apkUrl', 'javascript:alert(1)'],
    ['releaseUrl', 'metri://profile'],
  ])('rejects %s = %p', (key, value) => {
    expect(parseLatestRelease({ ...VALID, [key]: value })).toBeNull();
  });

  it('rejects anything that is not an object', () => {
    for (const raw of [null, undefined, '1.14.0', 3, [VALID]]) {
      expect(parseLatestRelease(raw)).toBeNull();
    }
  });
});
