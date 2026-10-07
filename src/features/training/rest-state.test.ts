import { describe, expect, it, vi } from 'vitest';

import { shiftRestEnd } from './rest-state';

// The module also exports the MMKV hook, which pulls in react-native.
vi.mock('react-native-mmkv', () => ({ useMMKVString: () => [undefined] }));
vi.mock('@/lib/storage', () => ({ SettingKeys: {}, storage: {} }));

const NOW = 1_000_000;

describe('shiftRestEnd', () => {
  it('extends a running rest from its own end', () => {
    expect(shiftRestEnd(NOW + 20_000, NOW, 30)).toBe(NOW + 50_000);
  });

  it('restarts from now when the rest already ended (a +30 s on a ringing alarm buys 30 s)', () => {
    expect(shiftRestEnd(NOW - 5_000, NOW, 30)).toBe(NOW + 30_000);
  });

  it('shortens a running rest that still has time left', () => {
    expect(shiftRestEnd(NOW + 90_000, NOW, -30)).toBe(NOW + 60_000);
  });

  it('reports the rest over when the reduction lands exactly on now', () => {
    expect(shiftRestEnd(NOW + 30_000, NOW, -30)).toBeNull();
  });

  it('reports the rest over when the reduction goes past now', () => {
    expect(shiftRestEnd(NOW + 10_000, NOW, -60)).toBeNull();
  });

  it('keeps the end untouched on a zero shift', () => {
    expect(shiftRestEnd(NOW + 10_000, NOW, 0)).toBe(NOW + 10_000);
  });
});
