import { beforeEach, describe, expect, it, vi } from 'vitest';

const { perform, platform } = vi.hoisted(() => ({
  perform: vi.fn<(type: string) => Promise<void>>(),
  platform: { OS: 'android' },
}));

vi.mock('react-native', () => ({ Platform: platform }));
vi.mock('expo-haptics', () => ({
  AndroidHaptics: {
    Segment_Tick: 'segment-tick',
    Clock_Tick: 'clock-tick',
    Virtual_Key: 'virtual-key',
    Toggle_On: 'toggle-on',
    Toggle_Off: 'toggle-off',
    Context_Click: 'context-click',
    Confirm: 'confirm',
    Long_Press: 'long-press',
    Drag_Start: 'drag-start',
  },
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success' },
  performAndroidHapticsAsync: perform,
  impactAsync: vi.fn(() => Promise.resolve()),
  notificationAsync: vi.fn(() => Promise.resolve()),
  selectionAsync: vi.fn(() => Promise.resolve()),
}));

const { haptic } = await import('./haptics');

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  perform.mockClear();
  perform.mockImplementation(() => Promise.resolve());
});

describe('haptic (Android)', () => {
  it('plays the richer constant when the device has it', async () => {
    perform.mockResolvedValue(undefined);
    haptic('confirm');
    await flush();
    expect(perform.mock.calls).toEqual([['confirm']]);
  });

  // Android 8–10 has no CONFIRM: the native side throws, the cue still buzzes,
  // and the refused constant is never tried again.
  it('falls back once a constant is refused, and remembers the refusal', async () => {
    perform.mockImplementation((type) =>
      type === 'segment-tick' ? Promise.reject(new Error('unsupported')) : Promise.resolve(),
    );
    haptic('tick');
    await flush();
    haptic('tick');
    await flush();
    expect(perform.mock.calls).toEqual([['segment-tick'], ['clock-tick'], ['clock-tick']]);
  });

  it('never throws into the caller when nothing can play', async () => {
    perform.mockImplementation(() => Promise.reject(new Error('no window')));
    expect(() => haptic('heavy')).not.toThrow();
    await flush();
  });
});
