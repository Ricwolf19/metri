import { describe, expect, it } from 'vitest';

import { appLinkFrom } from './app-link';

describe('appLinkFrom', () => {
  it('opens the app deep link a notification carries', () => {
    expect(appLinkFrom({ url: 'metri://profile' })).toBe('metri://profile');
  });

  it.each([
    ['a web page', { url: 'https://example.com' }],
    ['a javascript: URL', { url: 'javascript:alert(1)' }],
    ['a non-string url', { url: 42 }],
    ['no url at all', { event: 'session-checkin' }],
    ['no data', undefined],
    ['null data', null],
  ])('ignores %s', (_label, data) => {
    expect(appLinkFrom(data)).toBeNull();
  });
});
