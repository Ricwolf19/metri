import { useEffect, useLayoutEffect, useState } from 'react';
import { Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';

import { Scrim } from './Scrim';
import {
  computeStops,
  keyboardLift,
  keyboardLimit,
  scrimOpacity,
  sheetTranslate,
  type Bounds,
} from './sheet-math';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** A `<ScrollArea inSheet>` (or any flex view). */
  children: React.ReactNode;
  /**
   * Explicit height stops as window percentages, e.g. `['55%', '92%']`. Omit for
   * the default: the sheet takes its CONTENT's height, up to nearly full screen.
   */
  snapPoints?: string[];
  /**
   * Whether the handle can be dragged/tapped up to the last snap point. Only
   * meaningful with `snapPoints`: a content-sized sheet has a single stop.
   */
  expandable?: boolean;
};

/** Stops for option pickers (Select, TagPicker): half the screen, pulled up to
 * nearly full when the list is longer — a list scrolls, so it never needs to
 * open at full height the way a form with buttons does. */
export const PICKER_STOPS = ['50%', '92%'];
const RISE_MS = 200;
const FALL_MS = 160;
const SNAP_MS = 200;
const SCRIM_OPACITY = 0.6;
/** Dragging further than this share of the sheet below its smallest stop closes it. */
const CLOSE_RATIO = 0.25;
const FLING_VELOCITY = 900;
const EASE_OUT = Easing.out(Easing.cubic);
const HANDLE_WIDTH = 40;

// Shared-value writes stay in module-scope factories (AGENTS.md#architecture-invariants).
// `limit` is the sheet's MAX height: short content renders shorter than it and the
// sheet hugs the content; long content is clamped to it and scrolls. `shown` is
// the rise/fall (0 closed … 1 open) and `drag` the pull below the smallest stop.
const makeController = (
  limit: SharedValue<number>,
  shown: SharedValue<number>,
  drag: SharedValue<number>,
  bounds: SharedValue<Bounds>,
  sheetHeight: SharedValue<number>,
) => {
  let closing = false;
  /** When the running fall comes to rest, so a second close path waits it out. */
  let restsAt = 0;
  let onClose = () => {};
  // Every close path ends here: `shown` rests at 0, so the next mount's first
  // frame is below the edge.
  const fall = () => {
    closing = true;
    restsAt = Date.now() + FALL_MS;
    shown.value = withTiming(0, { duration: FALL_MS, easing: Easing.in(Easing.quad) });
  };
  const afterFall = (done: () => void) => setTimeout(done, Math.max(0, restsAt - Date.now()));
  return {
    setOnClose: (next: () => void) => {
      onClose = next;
    },
    setBounds: (next: Bounds) => {
      bounds.value = next;
    },
    /** onLayout: the height the sheet actually took, for the close-drag maths. */
    setSheetHeight: (next: number) => {
      sheetHeight.value = next;
    },
    /** Called when the Modal mounts: start below the edge, rise into place. */
    enter: () => {
      closing = false;
      limit.value = bounds.value.min;
      drag.value = 0;
      shown.value = 0;
      shown.value = withTiming(1, { duration: RISE_MS, easing: EASE_OUT });
    },
    /** Sheet-initiated close: play the fall, then let the parent flip `visible`. */
    close: () => {
      if (closing) return;
      fall();
      afterFall(onClose);
    },
    /**
     * Parent-initiated close (`visible` flipped false): play the fall unless one
     * is already running, then unmount once it rests. Returns the timer so the
     * caller can cancel the unmount on a re-open mid-fall.
     */
    leave: (unmount: () => void) => {
      if (!closing) fall();
      return afterFall(unmount);
    },
    toggle: () => {
      const { min, max } = bounds.value;
      const target = limit.value > (min + max) / 2 ? min : max;
      limit.value = withTiming(target, { duration: SNAP_MS, easing: EASE_OUT });
    },
  };
};

// Pan on the handle: up/down resizes between the stops, below the sheet's own
// height it follows the finger and a long enough pull (or a fling) closes it.
const makePan = (
  limit: SharedValue<number>,
  drag: SharedValue<number>,
  bounds: SharedValue<Bounds>,
  startLimit: SharedValue<number>,
  sheetHeight: SharedValue<number>,
  requestClose: () => void,
) =>
  Gesture.Pan()
    // Leave short movements to the handle's own press.
    .activeOffsetY([-8, 8])
    .onStart(() => {
      startLimit.value = limit.value;
    })
    .onUpdate((e) => {
      const { min, max } = bounds.value;
      const next = startLimit.value - e.translationY;
      if (next >= min) {
        limit.value = Math.min(max, next);
        drag.value = 0;
      } else {
        limit.value = min;
        drag.value = min - next;
      }
    })
    .onEnd((e) => {
      const { stops } = bounds.value;
      const height = sheetHeight.value || bounds.value.min;
      if (drag.value > height * CLOSE_RATIO || (drag.value > 0 && e.velocityY > FLING_VELOCITY)) {
        runOnJS(requestClose)();
        return;
      }
      drag.value = withTiming(0, { duration: SNAP_MS, easing: EASE_OUT });
      // Snap to the nearest stop, nudged by the fling direction.
      const biased = limit.value - e.velocityY * 0.08;
      let target = stops[0];
      for (const s of stops) if (Math.abs(s - biased) < Math.abs(target - biased)) target = s;
      limit.value = withTiming(target, { duration: SNAP_MS, easing: EASE_OUT });
    });

/**
 * The one bottom-sheet primitive, on a plain RN `Modal` so it opens every time on
 * every device: scrim fade + timing rise (no spring), drag the handle to resize
 * or pull it down to close; scrim tap, handle tap and hardware back close too.
 *
 * By default the sheet is **content-sized** — a five-option picker is five options
 * tall, a form shows every field and its buttons — up to nearly the full
 * screen, then its `<ScrollArea inSheet>` scrolls. Motion rules: AGENTS.md#conventions.
 *
 * Resting states: CLOSED is `shown = 0` (also its initial value), which puts
 * the sheet a full height CAP below the edge — it can never be taller, so the
 * first frame is hidden without waiting on a measurement; OPEN is `shown = 1`,
 * reached by `enter()` in a layout effect keyed on the open counter, which
 * re-runs on EVERY open. The scrim follows `shown` too (`sheet-math.ts`).
 * `Animated.View` paints its first frame from the shared values AS THEY ARE at
 * mount, so every close path —
 * hand-closed or parent-flipped `visible` — plays the fall and only then
 * unmounts the Modal, and a mount never starts at 0: both shapes drew one
 * open frame, then a drop below the edge, then the rise (appear / disappear /
 * appear). The effect-dependent shape AGENTS.md warns about was an effect that
 * did NOT re-run and hid the resting state; a deps-keyed layout effect is the
 * hand-close path that already ships, applied to every open.
 */
export const Sheet = ({ visible, onClose, children, snapPoints, expandable = true }: Props) => {
  const t = useT();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  /** A full-height sheet still stops below the status bar. */
  const ceiling = windowHeight - insets.top - 8;
  /**
   * The open boundary, derived during render from a `visible` flip (the React
   * "adjust state on prop change" shape — not a layout measurement, so no
   * effect sets it). `gen` counts opens; `falling` keeps the Modal mounted
   * while a parent-initiated close plays the fall, and a re-open mid-fall
   * clears it so the pending unmount is dropped.
   */
  const [seen, setSeen] = useState(visible);
  const [gen, setGen] = useState(0);
  const [falling, setFalling] = useState(false);
  if (visible !== seen) {
    setSeen(visible);
    if (visible) {
      setGen(gen + 1);
      setFalling(false);
    } else {
      setFalling(true);
    }
  }
  const mounted = visible || falling;
  /**
   * Latches true on the first layout that reaches the smallest stop, and resets
   * on the next open. The latch belongs to one OPEN, not to the component: a
   * single <Sheet> instance serves every selection, so a tall session must not
   * leave the next rest day expandable to full height over empty space. Keyed
   * on the open counter, not `visible` — that is true again on the second open.
   * Derived during render (never set from an effect) — same shape as
   * `useReorderedList`.
   */
  const [latch, setLatch] = useState({ gen, overflows: false });
  const overflows = latch.gen === gen ? latch.overflows : false;
  const bounded = computeStops(snapPoints, windowHeight, expandable, overflows, ceiling);
  const resizable = bounded.stops.length > 1;

  const limit = useSharedValue(bounded.min);
  // Starts CLOSED: `Animated.View` paints its first frame from the shared
  // value as it is at mount, so starting open drew a fresh sheet fully shown
  // for one frame before the rise effect dropped it below the edge (appear /
  // disappear / appear on every first open). The rise is a deps-keyed layout
  // effect that re-runs on each open; see the component comment.
  const shown = useSharedValue(0);
  const drag = useSharedValue(0);
  const bounds = useSharedValue<Bounds>(bounded);
  const startLimit = useSharedValue(bounded.min);
  const sheetHeight = useSharedValue(0);
  // Android never resizes a `statusBarTranslucent` Modal for the IME
  // (edge-to-edge), so translating the sheet is the only way to keep a field
  // above the keyboard; keyboard-controller reports the keyboard inside RN
  // Modals through its `ModalAttachedWatcher`. `height` is 0 closed and
  // NEGATIVE while open, `progress` runs 0..1. Needs `KeyboardProvider`
  // (`app/_layout.tsx`).
  const { height: kb, progress: kbProgress } = useReanimatedKeyboardAnimation();
  const [ctl] = useState(() => makeController(limit, shown, drag, bounds, sheetHeight));
  const [pan] = useState(() => makePan(limit, drag, bounds, startLimit, sheetHeight, ctl.close));

  useEffect(() => {
    ctl.setOnClose(onClose);
  }, [ctl, onClose]);

  useEffect(() => {
    ctl.setBounds(computeStops(snapPoints, windowHeight, expandable, overflows, ceiling));
  }, [ctl, snapPoints, windowHeight, expandable, overflows, ceiling]);

  // Layout effect: a plain one runs AFTER the first paint, so a fresh sheet drew
  // one frame fully open, then jumped below the edge to rise (open/close/open
  // flicker). Keyed on `gen` so a re-open while the Modal is still mounted
  // (mid-fall) rises again. The resting state is still the shown position, so a
  // skipped effect leaves the sheet visible, never hidden.
  useLayoutEffect(() => {
    if (visible) ctl.enter();
  }, [visible, gen, ctl]);

  // Parent-initiated close: fall, then unmount. The cleanup drops the unmount
  // when a re-open clears `falling` before the fall rests.
  useEffect(() => {
    if (!falling) return;
    const timer = ctl.leave(() => setFalling(false));
    return () => clearTimeout(timer);
  }, [falling, ctl]);

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrimOpacity(shown.value, drag.value, sheetHeight.value, SCRIM_OPACITY),
  }));
  // `maxHeight`, not `height`: short content keeps its own height (the sheet hugs
  // it), long content is clamped here and scrolls inside. The keyboard shrinks
  // the cap and lifts the sheet (`sheet-math.ts`).
  const bottomInset = insets.bottom;
  const sheetStyle = useAnimatedStyle(() => ({
    maxHeight: keyboardLimit(limit.value, kb.value),
    transform: [
      {
        translateY: keyboardLift(
          sheetTranslate(shown.value, limit.value, drag.value),
          kb.value,
          bottomInset,
          kbProgress.value,
        ),
      },
    ],
  }));

  const onHandlePress = () => {
    if (resizable) ctl.toggle();
    else ctl.close();
  };

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={ctl.close}
    >
      {/* A Modal is its own native view tree: gestures need a root inside it. */}
      <GestureHandlerRootView style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Scrim depth="light" style={scrimStyle}>
          <Pressable
            className="flex-1"
            onPress={ctl.close}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          />
        </Scrim>
        <Animated.View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            ctl.setSheetHeight(h);
            // Resizing animates `maxHeight`, so this fires on EVERY frame of a
            // drag. Latching keeps that to a shared-value write instead of a
            // setState per frame — re-rendering mid-gesture is what stalled a
            // fast pull to the top. Once true it can never go back: the content
            // that overflowed the smallest stop is still there.
            if (!overflows && h >= bounded.min - 1) setLatch({ gen, overflows: true });
          }}
          style={[{ paddingBottom: insets.bottom }, sheetStyle]}
          className="overflow-hidden rounded-t-[28px] border-t border-ink-700 bg-ink-900"
        >
          <GestureDetector gesture={pan}>
            <Pressable
              onPress={onHandlePress}
              accessibilityRole="button"
              accessibilityLabel={resizable ? t('sheet.resize') : t('common.close')}
              hitSlop={10}
              className="items-center pb-3 pt-3"
            >
              {/* Always lime, never animated: the sweep it used to play on open
                  was one more thing drawing during the rise. */}
              <View style={{ width: HANDLE_WIDTH }} className="h-1 rounded-full bg-brand" />
            </Pressable>
          </GestureDetector>
          {children}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
};
