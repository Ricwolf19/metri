import { describe, expect, it } from 'vitest';

import { isNewerVersion, shouldCheckRelease } from './version';

describe('isNewerVersion', () => {
  it('reports a newer patch/minor/major', () => {
    expect(isNewerVersion('1.11.0', '1.11.1')).toBe(true);
    expect(isNewerVersion('1.11.0', '1.12.0')).toBe(true);
    expect(isNewerVersion('1.11.0', '2.0.0')).toBe(true);
  });

  it('ignores older and equal versions', () => {
    expect(isNewerVersion('1.11.0', '1.10.9')).toBe(false);
    expect(isNewerVersion('1.11.0', '1.11.0')).toBe(false);
  });

  it('compares missing segments as zero', () => {
    expect(isNewerVersion('1.11', '1.11.0')).toBe(false);
    expect(isNewerVersion('1.11', '1.11.1')).toBe(true);
  });

  it('accepts a leading v on either side', () => {
    expect(isNewerVersion('1.11.0', 'v1.12.0')).toBe(true);
    expect(isNewerVersion('v1.12.0', '1.12.0')).toBe(false);
  });

  it('ignores +build metadata', () => {
    expect(isNewerVersion('1.11.0+42', '1.11.0+43')).toBe(false);
    expect(isNewerVersion('1.11.0+42', '1.11.1')).toBe(true);
  });

  it('never reports on a pre-release, non-numeric or malformed input', () => {
    expect(isNewerVersion('1.11.0-beta', '1.12.0')).toBe(false);
    expect(isNewerVersion('1.11.0', '1.12.0-beta.1')).toBe(false);
    expect(isNewerVersion('1.11.0', 'latest')).toBe(false);
    expect(isNewerVersion('', '1.0.0')).toBe(false);
  });
});

describe('shouldCheckRelease', () => {
  const DAY = 24 * 60 * 60 * 1000;
  const NOW = 10 * DAY;

  it('never checks for a local account, however stale', () => {
    expect(shouldCheckRelease({ hasServerAccount: false, checkedAt: 0, now: NOW })).toBe(false);
  });

  it('skips a remote account checked within the last day', () => {
    expect(shouldCheckRelease({ hasServerAccount: true, checkedAt: NOW - DAY + 1, now: NOW })).toBe(
      false,
    );
  });

  it('checks a remote account once the last attempt is a day old', () => {
    expect(shouldCheckRelease({ hasServerAccount: true, checkedAt: NOW - DAY, now: NOW })).toBe(
      true,
    );
    expect(shouldCheckRelease({ hasServerAccount: true, checkedAt: 0, now: NOW })).toBe(true);
  });

  it('checks when the stamp is in the future (the clock went back)', () => {
    expect(shouldCheckRelease({ hasServerAccount: true, checkedAt: NOW + DAY, now: NOW })).toBe(
      true,
    );
    expect(shouldCheckRelease({ hasServerAccount: false, checkedAt: NOW + DAY, now: NOW })).toBe(
      false,
    );
  });
});
