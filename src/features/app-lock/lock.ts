import { authenticateAsync, getEnrolledLevelAsync, SecurityLevel } from 'expo-local-authentication';
import { AppState } from 'react-native';

import { settings } from '@/lib/storage';

/**
 * The private-section lock. The ONLY module importing
 * `expo-local-authentication`: the phone's own biometrics or PIN prove the
 * owner is holding it, and metri never sees, stores or sends either — the OS
 * answers yes or no. What IS stored is the choice of which sections ask
 * (`settings.getSectionLock`). The unlock itself lives in memory only: one
 * success opens every locked section until the app goes to the background, and
 * a process start always begins locked.
 */

export type LockSection = 'photos' | 'settings';
export const LOCK_SECTIONS: readonly LockSection[] = ['photos', 'settings'];

let unlocked = false;
/** Android's PIN screen is another activity, so asking reads as a trip to the background. */
let authenticating = false;
/** Screens metri opened itself (the photo picker, a permission dialog) are not leaving the app. */
let openedByUs = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// iOS turns 'inactive' for Face ID's own sheet: only a real trip to the
// background relocks, and never one the prompt itself caused.
let watching = false;
const watchBackground = () => {
  if (watching) return;
  watching = true;
  AppState.addEventListener('change', (state) => {
    if (state !== 'background' || !unlocked || authenticating || openedByUs > 0) return;
    unlocked = false;
    emit();
  });
};

export const subscribeLock = (listener: () => void): (() => void) => {
  watchBackground();
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Run `task` — one that opens a system screen over the app, like the photo
 * picker — without that trip relocking: on Android it reads as going to the
 * background, and the relock would unmount the very screen waiting for the
 * answer (a locked section draws nothing of itself).
 */
export const keepUnlockedWhile = async <T>(task: () => Promise<T>): Promise<T> => {
  openedByUs += 1;
  try {
    return await task();
  } finally {
    openedByUs -= 1;
  }
};

/** A section is locked when it asks and nothing unlocked it since the last background. */
export const isLocked = (section: LockSection): boolean =>
  settings.getSectionLock(section) && !unlocked;

/** Whether the phone has anything to unlock with: a PIN, pattern or biometric. */
export const canLock = async (): Promise<boolean> => {
  try {
    return (await getEnrolledLevelAsync()) !== SecurityLevel.NONE;
  } catch {
    return false;
  }
};

/**
 * The phone no longer has any screen lock (removing one takes the old PIN).
 * Whoever holds it IS its owner by the OS's own standard, and a lock nothing
 * can satisfy would shut the lifter out of their own photos.
 */
const NOTHING_TO_UNLOCK_WITH = new Set(['not_enrolled', 'passcode_not_set', 'not_available']);

/** Ask the OS. Biometrics with the device PIN as the fallback; a cancel is just `false`. */
export const authenticate = async (
  promptMessage: string,
  cancelLabel: string,
): Promise<boolean> => {
  watchBackground();
  if (authenticating) return false;
  authenticating = true;
  try {
    const result = await authenticateAsync({
      promptMessage,
      cancelLabel,
      disableDeviceFallback: false,
    });
    if (!result.success && !NOTHING_TO_UNLOCK_WITH.has(result.error)) return false;
    unlocked = true;
    emit();
    return true;
  } catch {
    return false;
  } finally {
    authenticating = false;
  }
};

/**
 * Turn a section's lock on or off — either way only after the owner proves it
 * (on: that the phone CAN unlock it; off: that it's them). False = unchanged.
 */
export const setSectionLock = async (
  section: LockSection,
  value: boolean,
  prompt: { message: string; cancel: string },
): Promise<boolean> => {
  if (value && !(await canLock())) return false;
  if (!(await authenticate(prompt.message, prompt.cancel))) return false;
  settings.setSectionLock(section, value);
  emit();
  return true;
};
