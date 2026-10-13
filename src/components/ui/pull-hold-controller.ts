import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Easing, withTiming, type SharedValue } from 'react-native-reanimated';

import {
  HOLD_DEBOUNCE_MS,
  HOLD_MS,
  INITIAL_PULL,
  reducePullHold,
  type PullHold,
} from './pull-hold';

/**
 * Drives the pure `reducePullHold` from the scroll view's drag events and
 * paints the progress hairline: a module-scope factory, so the shared-value
 * writes and the mutable bookkeeping stay out of render (the same shape as
 * `scroll-visibility` and `TimedModal`). The handlers are created once and
 * passed straight to the scroll view, so a re-render never re-creates them.
 */
export const makePullHoldController = (
  progress: SharedValue<number>,
  forward: (e: NativeSyntheticEvent<NativeScrollEvent>) => void,
) => {
  let state: PullHold = INITIAL_PULL;
  let fire: () => void = () => {};
  let enabled = false;
  let atTop = true;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let barTimer: ReturnType<typeof setTimeout> | null = null;

  const stopTimers = () => {
    if (timer) clearTimeout(timer);
    if (barTimer) clearTimeout(barTimer);
    timer = null;
    barTimer = null;
  };

  const apply = (next: PullHold) => {
    const was = state.state;
    state = next;
    if (next.state === 'holding' && was !== 'holding') {
      stopTimers();
      // The bar only starts once the touch has outlived a scroll's first instant,
      // then fills over what is left of the hold.
      barTimer = setTimeout(() => {
        progress.value = withTiming(1, {
          duration: HOLD_MS - HOLD_DEBOUNCE_MS,
          easing: Easing.linear,
        });
      }, HOLD_DEBOUNCE_MS);
      timer = setTimeout(
        () => apply(reducePullHold(state, { type: 'tick', now: Date.now() })),
        HOLD_MS,
      );
    }
    if (next.state !== 'holding' && was === 'holding') {
      stopTimers();
      progress.value = withTiming(0, { duration: 120 });
    }
    if (next.state === 'fired' && was !== 'fired') fire();
  };

  return {
    /** Point the controller at the current handler; `undefined` switches it off. */
    configure: (onFire: (() => void) | undefined) => {
      enabled = !!onFire;
      fire = onFire ?? (() => {});
    },
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      forward(e);
      const y = e.nativeEvent.contentOffset.y;
      atTop = y <= 0;
      if (enabled) apply(reducePullHold(state, { type: 'scroll', y }));
    },
    onScrollBeginDrag: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      atTop = e.nativeEvent.contentOffset.y <= 0;
      if (enabled) apply(reducePullHold(state, { type: 'beginDrag', atTop, now: Date.now() }));
    },
    onScrollEndDrag: () => {
      if (enabled) apply(reducePullHold(state, { type: 'endDrag' }));
    },
  };
};
