import {
  AndroidHaptics,
  impactAsync,
  ImpactFeedbackStyle,
  notificationAsync,
  NotificationFeedbackType,
  performAndroidHapticsAsync,
  selectionAsync,
} from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * The app's touch feedback. The ONLY module importing `expo-haptics`, the way
 * `sounds.ts` owns expo-audio: a screen names a cue, never a vibration.
 *
 * Android plays through `View.performHapticFeedback`, which follows the
 * system's own "touch feedback" switch (so metri needs no setting of its own)
 * and needs no VIBRATE permission. Several of the richer constants exist only
 * from Android 11 or 14 and the native side throws for a missing one, so each
 * cue carries a fallback every API level has; a constant that threw once is
 * remembered and never tried again. Every call is fire-and-forget and
 * swallowed: a buzz must never break the tap that asked for it.
 */
export type HapticCue =
  /** Moving through a set of choices: a picker step, a segment, a chip. */
  | 'tick'
  /** A small press that changed something: a ± step. */
  | 'tap'
  /** A switch turned on or off. */
  | 'toggleOn'
  | 'toggleOff'
  /** Something was saved: a set logged, an effort picked, a workout finished. */
  | 'confirm'
  /** A hold that just fired an irreversible action. */
  | 'heavy'
  /** Something picked up to move (a chip lifted to reorder). Rest-over has no cue: the
   * alarm's own repeating buzz (`sounds.ts`) already is one. */
  | 'lift';

const ANDROID: Record<HapticCue, readonly [AndroidHaptics, AndroidHaptics]> = {
  tick: [AndroidHaptics.Segment_Tick, AndroidHaptics.Clock_Tick],
  tap: [AndroidHaptics.Virtual_Key, AndroidHaptics.Virtual_Key],
  toggleOn: [AndroidHaptics.Toggle_On, AndroidHaptics.Context_Click],
  toggleOff: [AndroidHaptics.Toggle_Off, AndroidHaptics.Clock_Tick],
  confirm: [AndroidHaptics.Confirm, AndroidHaptics.Virtual_Key],
  heavy: [AndroidHaptics.Long_Press, AndroidHaptics.Long_Press],
  lift: [AndroidHaptics.Drag_Start, AndroidHaptics.Long_Press],
};

const IOS: Record<HapticCue, () => Promise<void>> = {
  tick: () => selectionAsync(),
  tap: () => impactAsync(ImpactFeedbackStyle.Light),
  toggleOn: () => impactAsync(ImpactFeedbackStyle.Light),
  toggleOff: () => impactAsync(ImpactFeedbackStyle.Light),
  confirm: () => notificationAsync(NotificationFeedbackType.Success),
  heavy: () => impactAsync(ImpactFeedbackStyle.Heavy),
  lift: () => impactAsync(ImpactFeedbackStyle.Medium),
};

/** Constants this device's Android refused: skipped straight to the fallback. */
const unsupported = new Set<AndroidHaptics>();

const playAndroid = async (cue: HapticCue): Promise<void> => {
  const [preferred, fallback] = ANDROID[cue];
  if (!unsupported.has(preferred)) {
    try {
      await performAndroidHapticsAsync(preferred);
      return;
    } catch {
      unsupported.add(preferred);
    }
  }
  if (fallback !== preferred) await performAndroidHapticsAsync(fallback);
};

/** No haptics engine, no window, a locked screen: feedback is optional. */
const ignore = (): void => undefined;

/** Play a cue. Never throws, never awaits: call it inline in a handler. */
export const haptic = (cue: HapticCue): void => {
  try {
    const run =
      Platform.OS === 'android' ? playAndroid(cue) : Platform.OS === 'ios' ? IOS[cue]() : null;
    run?.catch(ignore);
  } catch {
    ignore();
  }
};
