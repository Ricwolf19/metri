import { useEffect, useState } from 'react';
import { Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Scrim } from './Scrim';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** A `<ScrollArea inSheet>` (or any flex view). */
  children: React.ReactNode;
  /**
   * Explicit height stops as window percentages, e.g. `['55%', '92%']`. Omit for
   * the default: the sheet takes its CONTENT's height, capped at half the screen.
   */
  snapPoints?: string[];
  /** Whether the handle can be dragged/tapped up to the last snap point. */
  expandable?: boolean;
};

type Bounds = { min: number; max: number; stops: number[] };

/** Content-sized sheets never take more than half the screen… */
const FIT_CAP = 0.5;
/** …and expand to this only when the content actually overflows the cap. */
const FIT_EXPANDED = 0.92;
const RISE_MS = 220;
const FALL_MS = 170;
const SNAP_MS = 200;
const SCRIM_OPACITY = 0.6;
/** Dragging further than this share of the sheet below its smallest stop closes it. */
const CLOSE_RATIO = 0.25;
const FLING_VELOCITY = 900;
const EASE_OUT = Easing.out(Easing.cubic);
const HANDLE_WIDTH = 40;
/** One sweep on open; the handle then STAYS lime. A resting state is an
 * affordance, a loop is noise. */
const HINT_MS = 420;

const pct = (stop: string): number => Math.min(1, Math.max(0.2, parseFloat(stop) / 100));

// Shared-value writes stay in module-scope factories (AGENTS.md#architecture-invariants).
// `limit` is the sheet's MAX height: short content renders shorter than it and the
// sheet hugs the content; long content is clamped to it and scrolls. `offset`
// slides the sheet out during the rise/fall and when a drag goes below the sheet.
const makeController = (
  limit: SharedValue<number>,
  offset: SharedValue<number>,
  bounds: SharedValue<Bounds>,
  sheetHeight: SharedValue<number>,
  hint: SharedValue<number>,
) => {
  let closing = false;
  let onClose = () => {};
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
      // Rise from the cap rather than the measured height — it is at least as
      // tall, so the sheet still starts off-screen without waiting on layout.
      offset.value = bounds.value.min;
      offset.value = withTiming(0, { duration: RISE_MS, easing: EASE_OUT });
    },
    hintAt: () => {
      hint.value = 0;
      hint.value = withTiming(1, { duration: HINT_MS, easing: Easing.inOut(Easing.quad) });
    },
    /** Sheet-initiated close: play the fall, then let the parent flip `visible`. */
    close: () => {
      if (closing) return;
      closing = true;
      offset.value = withTiming(sheetHeight.value || limit.value, {
        duration: FALL_MS,
        easing: Easing.in(Easing.quad),
      });
      setTimeout(() => onClose(), FALL_MS);
    },
    toggle: () => {
      const { min, max } = bounds.value;
      const target = limit.value > (min + max) / 2 ? min : max;
      limit.value = withTiming(target, { duration: SNAP_MS, easing: EASE_OUT });
    },
  };
};

/**
 * The height stops. `snapPoints` gives them explicitly; otherwise it is the fit
 * cap alone.
 *
 * In BOTH cases the taller stops are only offered once the content is known to
 * overflow the first one: the sheet sizes to its content, so on a short list
 * dragging up would stretch nothing. Gating here is what keeps the handle hint
 * and the tap-to-toggle honest.
 */
const computeStops = (
  snapPoints: string[] | undefined,
  windowHeight: number,
  expandable: boolean,
  overflows: boolean,
  ceiling: number,
): Bounds => {
  const cap = (px: number) => Math.min(px, ceiling);
  const stops = snapPoints
    ? [...new Set(snapPoints.map((s) => cap(Math.round(windowHeight * pct(s)))))].sort(
        (a, b) => a - b,
      )
    : [cap(Math.round(windowHeight * FIT_CAP)), cap(Math.round(windowHeight * FIT_EXPANDED))];
  const min = stops[0];
  if (!expandable || !overflows) return { min, max: min, stops: [min] };
  return { min, max: stops[stops.length - 1], stops };
};

// Pan on the handle: up/down resizes between the stops, below the sheet's own
// height it follows the finger and a long enough pull (or a fling) closes it.
const makePan = (
  limit: SharedValue<number>,
  offset: SharedValue<number>,
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
        offset.value = 0;
      } else {
        limit.value = min;
        offset.value = min - next;
      }
    })
    .onEnd((e) => {
      const { stops } = bounds.value;
      const height = sheetHeight.value || bounds.value.min;
      if (
        offset.value > height * CLOSE_RATIO ||
        (offset.value > 0 && e.velocityY > FLING_VELOCITY)
      ) {
        runOnJS(requestClose)();
        return;
      }
      offset.value = withTiming(0, { duration: SNAP_MS, easing: EASE_OUT });
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
 * tall, not half an empty screen — and only grows draggable once its content
 * exceeds half the screen. Its resting state is fully visible; the animations
 * only decorate it. Motion rules: AGENTS.md#conventions.
 */
export const Sheet = ({ visible, onClose, children, snapPoints, expandable = true }: Props) => {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  /** A full-height sheet still stops below the status bar. */
  const ceiling = windowHeight - insets.top - 8;
  /**
   * Latches true on the first layout that reaches the smallest stop, and resets
   * on the next open. The latch belongs to one OPEN, not to the component: a
   * single <Sheet> instance serves every selection, so a tall session must not
   * leave the next rest day expandable to full height over empty space.
   * Derived during render (never set from an effect) — same shape as
   * `useReorderedList`.
   */
  const [latch, setLatch] = useState({ visible, overflows: false });
  const overflows = latch.visible === visible ? latch.overflows : false;
  const bounded = computeStops(snapPoints, windowHeight, expandable, overflows, ceiling);
  const resizable = bounded.stops.length > 1;

  const limit = useSharedValue(bounded.min);
  const offset = useSharedValue(0);
  const bounds = useSharedValue<Bounds>(bounded);
  const startLimit = useSharedValue(bounded.min);
  const sheetHeight = useSharedValue(0);
  const hint = useSharedValue(0);
  const [ctl] = useState(() => makeController(limit, offset, bounds, sheetHeight, hint));
  const [pan] = useState(() => makePan(limit, offset, bounds, startLimit, sheetHeight, ctl.close));

  useEffect(() => {
    ctl.setOnClose(onClose);
  }, [ctl, onClose]);

  useEffect(() => {
    ctl.setBounds(computeStops(snapPoints, windowHeight, expandable, overflows, ceiling));
  }, [ctl, snapPoints, windowHeight, expandable, overflows, ceiling]);

  useEffect(() => {
    if (visible) ctl.enter();
  }, [visible, ctl]);

  useEffect(() => {
    if (visible) ctl.hintAt();
  }, [visible, ctl]);

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: SCRIM_OPACITY * (1 - offset.value / Math.max(1, sheetHeight.value || limit.value)),
  }));
  // `maxHeight`, not `height`: short content keeps its own height (the sheet hugs
  // it), long content is clamped here and scrolls inside.
  const sheetStyle = useAnimatedStyle(() => ({
    maxHeight: limit.value,
    transform: [{ translateY: offset.value }],
  }));
  const hintStyle = useAnimatedStyle(() => ({ width: HANDLE_WIDTH * hint.value }));

  const onHandlePress = () => {
    if (resizable) ctl.toggle();
    else ctl.close();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={ctl.close}
    >
      {/* A Modal is its own native view tree: gestures need a root inside it. */}
      <GestureHandlerRootView style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Scrim depth="light" style={scrimStyle}>
          <Pressable className="flex-1" onPress={ctl.close} accessibilityRole="button" />
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
            if (!overflows && h >= bounded.min - 1) setLatch({ visible, overflows: true });
          }}
          style={[{ paddingBottom: insets.bottom }, sheetStyle]}
          className="overflow-hidden rounded-t-[28px] border-t border-ink-700 bg-ink-900"
        >
          <GestureDetector gesture={pan}>
            <Pressable
              onPress={onHandlePress}
              accessibilityRole="button"
              hitSlop={10}
              className="items-center pb-3 pt-3"
            >
              <View
                style={{ width: HANDLE_WIDTH }}
                className="h-1 overflow-hidden rounded-full bg-ink-600"
              >
                <Animated.View style={hintStyle} className="h-full rounded-full bg-brand" />
              </View>
            </Pressable>
          </GestureDetector>
          {children}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
};
