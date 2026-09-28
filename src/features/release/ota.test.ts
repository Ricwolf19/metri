import { beforeEach, describe, expect, it, vi } from 'vitest';

const updates = vi.hoisted(() => ({
  isEnabled: true,
  runtimeVersion: 'rt-1',
  checkForUpdateAsync: vi.fn(),
  fetchUpdateAsync: vi.fn(),
  reloadAsync: vi.fn(),
}));

vi.mock('expo-updates', () => updates);
vi.mock('@/lib/telemetry', () => ({ captureError: vi.fn() }));
vi.mock('@/lib/env', () => ({ APP_VERSION: '1.0.0' }));

const load = async () => {
  vi.resetModules();
  return import('./ota');
};

describe('stageOtaUpdate', () => {
  beforeEach(() => {
    updates.checkForUpdateAsync.mockReset();
    updates.fetchUpdateAsync.mockReset();
  });

  it('asks again after the channel had nothing yet (the API can announce first)', async () => {
    const { stageOtaUpdate } = await load();
    updates.checkForUpdateAsync.mockResolvedValueOnce({ isAvailable: false });
    expect(await stageOtaUpdate()).toBe(false);

    updates.checkForUpdateAsync.mockResolvedValueOnce({ isAvailable: true });
    updates.fetchUpdateAsync.mockResolvedValueOnce({ isNew: true });
    expect(await stageOtaUpdate()).toBe(true);
    expect(updates.checkForUpdateAsync).toHaveBeenCalledTimes(2);
  });

  it('asks again after a failed download', async () => {
    const { stageOtaUpdate } = await load();
    updates.checkForUpdateAsync.mockRejectedValueOnce(new Error('boom'));
    expect(await stageOtaUpdate()).toBe(false);

    updates.checkForUpdateAsync.mockResolvedValueOnce({ isAvailable: true });
    updates.fetchUpdateAsync.mockResolvedValueOnce({ isNew: true });
    expect(await stageOtaUpdate()).toBe(true);
  });

  it('shares one staged download across callers', async () => {
    const { stageOtaUpdate } = await load();
    updates.checkForUpdateAsync.mockResolvedValue({ isAvailable: true });
    updates.fetchUpdateAsync.mockResolvedValue({ isNew: true });
    const [a, b] = await Promise.all([stageOtaUpdate(), stageOtaUpdate()]);
    expect(await stageOtaUpdate()).toBe(true);
    expect([a, b]).toEqual([true, true]);
    expect(updates.fetchUpdateAsync).toHaveBeenCalledTimes(1);
  });
});
