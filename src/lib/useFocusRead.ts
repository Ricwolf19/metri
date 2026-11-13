import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { afterTransition } from './useTransitionSettled';

/**
 * A synchronous read (SQLite, a model over it) taken at mount, again whenever
 * `read` changes, and again on every return to the screen — AFTER the
 * transition has finished (`afterTransition`), not in the focus event itself:
 * re-reading while the tab animation was still drawing is what made Metrics
 * stutter in. `read` must be stable between renders (`useCallback` on its
 * inputs).
 *
 * A new `read` (a changed window, a resolved user) re-reads during THAT render
 * (the "adjust state on prop change" shape), so the result always matches the
 * inputs it was read for. It used to wait for `afterTransition` too, and with
 * no transition running that is the 450 ms fallback: the body map drew the old
 * window's sets against the new window's weekly target (wrong colours, then
 * the right ones) every time the window changed.
 */
export const useFocusRead = <T>(read: () => T): T => {
  const navigation = useNavigation();
  const [state, setState] = useState(() => ({ read, value: read() }));
  let current = state;
  if (state.read !== read) {
    current = { read, value: read() };
    setState(current);
  }

  const latest = useRef(read);
  useEffect(() => {
    latest.current = read;
  }, [read]);
  // The first focus of a screen that mounted focused IS the mount, and the
  // state above already read for it. A tab mounted in the background
  // (`lazy: false`) read at launch, so its first focus reads again.
  const [skipFirst] = useState(() => navigation.isFocused());
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      const first = !focusedOnce.current;
      focusedOnce.current = true;
      if (first && skipFirst) return;
      return afterTransition(navigation, () => {
        const next = latest.current;
        setState({ read: next, value: next() });
      });
    }, [navigation, skipFirst]),
  );
  return current.value;
};
