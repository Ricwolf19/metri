import { beforeEach, describe, expect, it, vi } from 'vitest';

type Result = { success: true } | { success: false; error: string };

const h = vi.hoisted(() => ({
  appState: null as ((s: string) => void) | null,
  stored: new Map<string, boolean>(),
  auth: vi.fn<() => Promise<Result>>(),
  level: vi.fn<() => Promise<number>>(),
}));

vi.mock('react-native', () => ({
  AppState: {
    addEventListener: (_: string, fn: (s: string) => void) => {
      h.appState = fn;
      return { remove: () => {} };
    },
  },
}));
vi.mock('expo-local-authentication', () => ({
  authenticateAsync: h.auth,
  getEnrolledLevelAsync: h.level,
  SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC_WEAK: 2, BIOMETRIC_STRONG: 3 },
}));
vi.mock('@/lib/storage', () => ({
  settings: {
    getSectionLock: (s: string) => h.stored.get(s) ?? false,
    setSectionLock: (s: string, v: boolean) => h.stored.set(s, v),
  },
}));

const { authenticate, isLocked, keepUnlockedWhile, setSectionLock, subscribeLock } =
  await import('./lock');

const prompt = { message: 'Confirm', cancel: 'Cancel' };
const background = () => h.appState?.('background');

beforeEach(() => {
  h.stored.clear();
  h.auth.mockReset();
  h.level.mockReset().mockResolvedValue(2);
  subscribeLock(() => {});
  background();
});

describe('the section lock', () => {
  it('turns on only after the owner proves it, and then starts unlocked', async () => {
    h.auth.mockResolvedValueOnce({ success: false, error: 'user_cancel' });
    expect(await setSectionLock('photos', true, prompt)).toBe(false);
    expect(isLocked('photos')).toBe(false);

    h.auth.mockResolvedValueOnce({ success: true });
    expect(await setSectionLock('photos', true, prompt)).toBe(true);
    expect(isLocked('photos')).toBe(false);
  });

  it('relocks on a trip to the background, and one success opens every section', async () => {
    h.stored.set('photos', true).set('settings', true);
    expect(isLocked('photos')).toBe(true);
    h.auth.mockResolvedValueOnce({ success: true });
    await authenticate('Unlock', 'Cancel');
    expect(isLocked('photos') || isLocked('settings')).toBe(false);
    background();
    expect(isLocked('settings')).toBe(true);
  });

  // Android's PIN screen is another activity: asking reads as backgrounding.
  it('does not relock because of its own prompt', async () => {
    h.stored.set('photos', true);
    h.auth.mockResolvedValueOnce({ success: true });
    await authenticate('Unlock', 'Cancel');
    h.auth.mockImplementationOnce(async () => {
      background();
      return { success: true };
    });
    await authenticate('Unlock', 'Cancel');
    expect(isLocked('photos')).toBe(false);
  });

  // The photo picker and a permission dialog are activities too: the camera
  // screen waiting for the pick must not be unmounted by its own trip out.
  it('stays open through a system screen it opened itself, and only that', async () => {
    h.stored.set('photos', true);
    h.auth.mockResolvedValueOnce({ success: true });
    await authenticate('Unlock', 'Cancel');
    expect(
      await keepUnlockedWhile(async () => {
        background();
        return 'picked';
      }),
    ).toBe('picked');
    expect(isLocked('photos')).toBe(false);
    await expect(
      keepUnlockedWhile(async () => {
        throw new Error('picker failed');
      }),
    ).rejects.toThrow();
    background();
    expect(isLocked('photos')).toBe(true);
  });

  it('never shuts the owner out once the phone has no screen lock left', async () => {
    h.stored.set('photos', true);
    h.auth.mockResolvedValueOnce({ success: false, error: 'not_enrolled' });
    expect(await authenticate('Unlock', 'Cancel')).toBe(true);
    expect(isLocked('photos')).toBe(false);
  });

  it('cannot be turned on with nothing to unlock with', async () => {
    h.level.mockResolvedValue(0);
    expect(await setSectionLock('settings', true, prompt)).toBe(false);
    expect(h.auth).not.toHaveBeenCalled();
  });
});
