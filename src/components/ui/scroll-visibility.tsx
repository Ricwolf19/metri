import { createContext, useContext, useState, type ReactNode } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

type ScrollVisibility = {
  /** 1 = chrome (header + tab bar) visible, 0 = hidden. Drive animated styles off it. */
  shown: SharedValue<number>;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const ScrollVisibilityContext = createContext<ScrollVisibility | null>(null);

/** Null outside the provider — screens then render their chrome static. */
export const useScrollVisibility = () => useContext(ScrollVisibilityContext);

const THRESHOLD = 24;

// Module-level factory (not hooks) so the mutable scroll bookkeeping and the
// shared-value writes live outside render — the React Compiler only sees a
// stable object coming out of useState.
const makeController = (shown: SharedValue<number>): ScrollVisibility => {
  let anchorY = 0;
  let visible = true;

  const setVisible = (next: boolean) => {
    if (next === visible) return;
    visible = next;
    shown.value = withTiming(next ? 1 : 0, { duration: 200 });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const y = contentOffset.y;
    const maxY = contentSize.height - layoutMeasurement.height;
    // At either edge (or on short content) the chrome always shows.
    if (y <= 0 || y >= maxY) {
      setVisible(true);
      anchorY = Math.max(0, Math.min(y, Math.max(maxY, 0)));
      return;
    }
    const dy = y - anchorY;
    if (dy > THRESHOLD) {
      setVisible(false);
      anchorY = y;
    } else if (dy < -THRESHOLD) {
      setVisible(true);
      anchorY = y;
    }
  };

  return { shown, onScroll };
};

/**
 * Local controller for stack screens (back-arrow headers): same floating pill
 * + hide-on-scroll behavior, scoped to the one screen instead of the tab shell.
 */
export const useLocalScrollVisibility = (): ScrollVisibility => {
  const shown = useSharedValue(1);
  const [ctrl] = useState(() => makeController(shown));
  return ctrl;
};

/**
 * Shared hide-on-scroll state for the tab shell: every tab screen feeds its
 * scroll into one controller, and both the floating header and the floating
 * tab bar slide away on scroll-down, back on scroll-up or at the edges.
 * The value is a reanimated SharedValue, so the transforms run on the UI thread.
 */
export const ScrollVisibilityProvider = ({ children }: { children: ReactNode }) => {
  const shown = useSharedValue(1);
  const [value] = useState(() => makeController(shown));
  return (
    <ScrollVisibilityContext.Provider value={value}>{children}</ScrollVisibilityContext.Provider>
  );
};
