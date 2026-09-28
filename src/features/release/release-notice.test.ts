import { describe, expect, it } from 'vitest';

import { shouldNotifyRelease } from './release-notice';

describe('shouldNotifyRelease', () => {
  it('announces the first actionable release', () => {
    expect(shouldNotifyRelease({ kind: 'apk', version: '1.15.0', notifiedVersion: null })).toBe(
      true,
    );
    expect(shouldNotifyRelease({ kind: 'ota', version: '1.15.0', notifiedVersion: null })).toBe(
      true,
    );
  });

  it('never announces a release this install cannot act on', () => {
    expect(shouldNotifyRelease({ kind: 'none', version: '1.15.0', notifiedVersion: null })).toBe(
      false,
    );
  });

  it('announces each version once', () => {
    expect(shouldNotifyRelease({ kind: 'apk', version: '1.15.0', notifiedVersion: '1.15.0' })).toBe(
      false,
    );
  });

  it('announces a version newer than the last one announced', () => {
    expect(shouldNotifyRelease({ kind: 'apk', version: '1.16.0', notifiedVersion: '1.15.0' })).toBe(
      true,
    );
  });

  it('stays quiet when the server rolls back below the last announced version', () => {
    expect(shouldNotifyRelease({ kind: 'apk', version: '1.15.0', notifiedVersion: '1.16.0' })).toBe(
      false,
    );
  });

  it('does not let an unreadable stored value mute future releases', () => {
    expect(shouldNotifyRelease({ kind: 'apk', version: '1.15.0', notifiedVersion: 'junk' })).toBe(
      true,
    );
  });
});
