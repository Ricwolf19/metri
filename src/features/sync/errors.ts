/**
 * The cycle was refused for a reason retrying cannot fix: the session is gone
 * (expired cookie, signed out elsewhere, deleted account) or the plan no longer
 * carries the sync entitlement. The caller stops instead of looping every
 * foreground, and `revalidate` clears a dead session on the next check.
 */
export class SyncAuthError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`sync unauthorized (${status})`);
    this.name = 'SyncAuthError';
    this.status = status;
  }
}

/** The session store had nothing to send yet — retryable, unlike the server's own refusal. */
export class SyncNoSessionError extends Error {
  constructor() {
    super('sync has no session cookie yet');
    this.name = 'SyncNoSessionError';
  }
}

/** 401/403 are terminal; every other status is worth another cycle. */
export const syncFailure = (stage: 'push' | 'pull', status: number): Error =>
  status === 401 || status === 403
    ? new SyncAuthError(status)
    : new Error(`${stage} failed (${status})`);
