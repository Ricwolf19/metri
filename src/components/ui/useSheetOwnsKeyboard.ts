import { useState, useSyncExternalStore } from 'react';
import { useKeyboardState } from 'react-native-keyboard-controller';

import { anySheetOpen, sheetOwnsKeyboard, subscribeSheetOpen } from './sheet-open';

/**
 * True while a sheet is up and owns the keyboard: the screen behind passes it
 * as `enabled={!owned}` to its keyboard-aware scroll view, avoiding view and
 * sticky footer, so nothing behind the sheet pads, scrolls or lifts for a
 * keyboard that belongs to the sheet (`sheet-open.ts` has the hand-over rule).
 */
export const useSheetOwnsKeyboard = (): boolean => {
  const sheetOpen = useSyncExternalStore(subscribeSheetOpen, anySheetOpen);
  const keyboardUp = useKeyboardState((state) => state.isVisible);
  // A keyboard already up when a screen mounts cannot be its own (no screen
  // autofocuses a field): one under a sheet that is still falling stays the
  // sheet's, or a screen pushed from the spotlight lifted its footer for it.
  const [owned, setOwned] = useState(anySheetOpen);
  const next = sheetOwnsKeyboard(owned, sheetOpen, keyboardUp);
  if (next !== owned) setOwned(next);
  return next;
};
