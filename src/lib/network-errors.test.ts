import { describe, expect, it } from 'vitest';

import { isNetworkFailure } from './network-errors';

/** Verbatim messages production reported while the device had no usable network. */
const CONNECTIVITY = [
  'fetch failed: java.net.UnknownHostException: Unable to resolve host "metri.info": No address associated with hostname',
  'fetch failed: The Internet connection appears to be offline.',
  'Network request failed',
  'java.net.SocketTimeoutException: timeout',
  'fetch failed: java.net.ConnectException: ECONNREFUSED',
];

describe('isNetworkFailure', () => {
  it.each(CONNECTIVITY)('treats connectivity loss as expected: %s', (message) => {
    expect(isNetworkFailure(new Error(message))).toBe(true);
  });

  it('leaves real defects reportable', () => {
    expect(isNetworkFailure(new Error('push failed (500)'))).toBe(false);
    expect(isNetworkFailure(new Error("Cannot read property 'id' of undefined"))).toBe(false);
  });

  it('handles non-errors without throwing', () => {
    expect(isNetworkFailure(undefined)).toBe(false);
    expect(isNetworkFailure(null)).toBe(false);
    expect(isNetworkFailure('')).toBe(false);
    expect(isNetworkFailure({ message: 'fetch failed' })).toBe(false);
  });
});
