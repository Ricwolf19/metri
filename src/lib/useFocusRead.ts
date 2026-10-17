import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';

/**
 * A synchronous read (SQLite, a model over it) taken once at mount and again
 * on every return to the screen — AFTER the transition has finished, not in
 * the focus event itself: re-reading while the tab animation was still
 * drawing is what made Metrics stutter in. `read` must be stable between
 * renders (`useCallback` on its inputs): a new identity re-reads at once,
 * which is how a changed window or user refreshes the value.
 */
export const useFocusRead = <T>(read: () => T): T => {
  const [value, setValue] = useState(read);
  // The first focus IS the mount, and `useState` already read for it.
  const lastRead = useRef<(() => T) | null>(read);
  useFocusEffect(
    useCallback(() => {
      if (lastRead.current === read) {
        lastRead.current = null;
        return;
      }
      lastRead.current = null;
      const task = InteractionManager.runAfterInteractions(() => setValue(read()));
      return () => task.cancel();
    }, [read]),
  );
  return value;
};
