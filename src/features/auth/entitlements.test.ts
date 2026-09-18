import { describe, expect, it } from 'vitest';

import { can, getTier } from './entitlements';

describe('entitlements', () => {
  // Table-driven: the tier gate every plan/banner surface keys off.
  it.each([
    ['no user', null, 'local'],
    ['device-only user', { authKind: 'local', plan: 'free' }, 'local'],
    ['free account', { authKind: 'remote', plan: 'free' }, 'free'],
    ['premium account', { authKind: 'remote', plan: 'premium' }, 'premium'],
    ['unknown plan normalizes down', { authKind: 'remote', plan: 'gold' }, 'free'],
  ] as const)('getTier: %s → %s', (_name, user, tier) => {
    expect(getTier(user as never)).toBe(tier);
  });

  it('sync stays premium-only regardless of authKind', () => {
    expect(can('premium', 'sync')).toBe(true);
    expect(can('free', 'sync')).toBe(false);
    expect(can(null, 'sync')).toBe(false);
  });
});
