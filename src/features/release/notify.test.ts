import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LatestRelease } from './payload';

const mocks = vi.hoisted(() => ({
  kind: 'ota' as 'none' | 'ota' | 'apk',
  staged: false,
  notified: null as string | null,
  notifyNow: vi.fn(async () => 'id'),
}));

vi.mock('@/features/notifications/service', () => ({
  hasNotificationPermission: async () => true,
  notifyNow: mocks.notifyNow,
}));
vi.mock('@/i18n', () => ({ resolveLocale: () => 'en' }));
vi.mock('@/i18n/en', () => ({
  en: { 'release.notifTitle': 'metri {version} is out', 'release.notifBody': 'Tap' },
}));
vi.mock('@/i18n/es', () => ({ es: {} }));
vi.mock('@/lib/storage', () => ({
  settings: {
    getNotificationsEnabled: () => true,
    getReleaseNotified: () => mocks.notified,
    setReleaseNotified: (v: string) => {
      mocks.notified = v;
    },
  },
}));
vi.mock('./ota', () => ({
  currentUpdateKind: () => mocks.kind,
  stageOtaUpdate: async () => mocks.staged,
}));

const { notifyReleaseOnce } = await import('./notify');

const release = { version: '1.2.0' } as LatestRelease;

describe('notifyReleaseOnce', () => {
  beforeEach(() => {
    mocks.notified = null;
    mocks.notifyNow.mockClear();
  });

  it('holds an OTA announcement until the update is staged, then sends it once', async () => {
    mocks.kind = 'ota';
    mocks.staged = false;
    await notifyReleaseOnce(release);
    expect(mocks.notifyNow).not.toHaveBeenCalled();
    expect(mocks.notified).toBeNull();

    mocks.staged = true;
    await notifyReleaseOnce(release);
    await notifyReleaseOnce(release);
    expect(mocks.notifyNow).toHaveBeenCalledTimes(1);
    expect(mocks.notified).toBe('1.2.0');
  });

  it('announces an APK release without staging anything', async () => {
    mocks.kind = 'apk';
    mocks.staged = false;
    await notifyReleaseOnce(release);
    expect(mocks.notifyNow).toHaveBeenCalledTimes(1);
  });
});
