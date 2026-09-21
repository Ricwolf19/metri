import { describe, expect, it } from 'vitest';

import { SyncAuthError, SyncNoSessionError, syncFailure } from './errors';

describe('syncFailure', () => {
  it('marks a rejected session terminal so the cycle stops instead of looping', () => {
    expect(syncFailure('push', 401)).toBeInstanceOf(SyncAuthError);
    expect(syncFailure('pull', 403)).toBeInstanceOf(SyncAuthError);
    expect(new SyncAuthError(401).status).toBe(401);
  });

  it('keeps every other status retryable, with the status in the message', () => {
    const failure = syncFailure('push', 500);
    expect(failure).not.toBeInstanceOf(SyncAuthError);
    expect(failure.message).toBe('push failed (500)');
    expect(syncFailure('pull', 429).message).toBe('pull failed (429)');
  });
});

describe('SyncNoSessionError', () => {
  // A cold session store is not the server refusing us: treating the two alike
  // disabled sync for the whole process after one unlucky launch.
  it('is not a refusal, so the caller can retry', () => {
    const noSession = new SyncNoSessionError();
    expect(noSession).not.toBeInstanceOf(SyncAuthError);
    expect(noSession.name).toBe('SyncNoSessionError');
  });
});
