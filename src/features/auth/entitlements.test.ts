import { describe, expect, it } from 'vitest';

import { can, getTier } from './entitlements';

describe('can', () => {
  it.each<[string | null | undefined, boolean]>([
    ['premium', true],
    ['free', false],
    ['unknown', false],
    [null, false],
    [undefined, false],
  ])('plan %s → sync %s', (plan, allowed) => {
    expect(can(plan, 'sync')).toBe(allowed);
  });
});

describe('getTier', () => {
  it('is local for device-only users regardless of the cached plan', () => {
    expect(getTier({ authKind: 'local', plan: 'premium' })).toBe('local');
    expect(getTier(null)).toBe('local');
  });

  it('maps remote users by plan, defaulting to free', () => {
    expect(getTier({ authKind: 'remote', plan: 'premium' })).toBe('premium');
    expect(getTier({ authKind: 'remote', plan: 'weird' })).toBe('free');
  });
});
