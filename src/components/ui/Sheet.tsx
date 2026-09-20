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

type Props = {
  visible: boolean;
  onClose: () => void;
  /** A `<ScrollArea inSheet>` (or any flex view). */
  children: React.ReactNode;
  /** Height stops as window percentages, e.g. `['55%', '92%']`; drag the handle between them. */
  snapPoints?: string[];
  /** Whether the handle can be dragged/tapped up to the last snap point. */
  expandable?: boolean;
};

type Bounds = { min: number; max: number; stops: number[] };

/** Enough for a short option list; callers with long content pass their own. */
const DEFAULT_SNAP_POINTS = ['55%', '92%'];
const RISE_MS = 220;
const FALL_MS = 170;
const SNAP_MS = 200;
const SCRIM_OPACITY = 0.6;
/** Dragging further than this share of the sheet below its smallest stop closes it. */
const CLOSE_RATIO = 0.25;
const FLING_VELOCITY = 900;
const EASE_OUT = Easing.out(Easing.cubic);

const pct = (stop: string): number => Math.min(0.98, Math.max(0.2, parseFloat(stop) / 100));

// Shared-value writes stay in module-scope factories (AGENTS.md#architecture-invariants).
// `height` is the visible sheet height (drag resizes it between the stops); `offset`
// slides the sheet out during the rise/fall and when a drag goes below the first stop.
const makeController = (
  height: SharedValue<number>,
  offset: SharedValue<number>,
  bounds: SharedValue<Bounds>,
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
    /** Called when the Modal mounts: start below the edge, rise to the first stop. */
    enter: () => {
      closing = false;
      height.value = bounds.value.min;
      offset.value = bounds.value.min;
      offset.value = withTiming(0, { duration: RISE_MS, easing: EASE_OUT });
    },
    /** Sheet-initiated close: play the fall, then let the parent flip `visible`. */
    close: () => {
      if (closing) return;
      closing = true;
      offset.value = withTiming(height.value, {
        duration: FALL_MS,
        easing: Easing.in(Easing.quad),
      });
      setTimeout(() => onClose(), FALL_MS);
    },
    toggle: () => {
      const { min, max } = bounds.value;
      const target = height.value > (min + max) / 2 ? min : max;
      height.value = withTiming(target, { duration: SNAP_MS, easing: EASE_OUT });
    },
  };
};

const computeStops = (snapPoints: string[], windowHeight: number, expandable: boolean): Bounds => {
  const stops = [...new Set(snapPoints.map((s) => Math.round(windowHeight * pct(s))))].sort(
    (a, b) => a - b,
  );
  const min = stops[0];
  return expandable
    ? { min, max: stops[stops.length - 1], stops }
    : { min, max: min, stops: [min] };
};

// Pan on the handle: up/down resizes between the stops, below the first stop the
// whole sheet follows the finger and a long enough pull (or a fling) closes it.
const makePan = (
  height: SharedValue<number>,
  offset: SharedValue<number>,
  bounds: SharedValue<Bounds>,
  startHeight: SharedValue<number>,
  requestClose: () => void,
) =>
  Gesture.Pan()
    // Leave short movements to the handle's own press.
    .activeOffsetY([-8, 8])
    .onStart(() => {
      startHeight.value = height.value;
    })
    .onUpdate((e) => {
      const { min, max } = bounds.value;
      const next = startHeight.value - e.translationY;
      if (next >= min) {
        height.value = Math.min(max, next);
        offset.value = 0;
      } else {
        height.value = min;
        offset.value = min - next;
      }
    })
    .onEnd((e) => {
      const { min, stops } = bounds.value;
      if (offset.value > min * CLOSE_RATIO || (offset.value > 0 && e.velocityY > FLING_VELOCITY)) {
        runOnJS(requestClose)();
        return;
      }
      offset.value = withTiming(0, { duration: SNAP_MS, easing: EASE_OUT });
      // Snap to the nearest stop, nudged by the fling direction.
      const biased = height.value - e.velocityY * 0.08;
      let target = stops[0];
      for (const s of stops) if (Math.abs(s - biased) < Math.abs(target - biased)) target = s;
      height.value = withTiming(target, { duration: SNAP_MS, easing: EASE_OUT });
    });

/**
 * The one bottom-sheet primitive, on a plain RN `Modal` so it opens every time on
 * every device: scrim fade + timing rise (no spring), drag the handle to resize
 * between the snap points or pull it down to close; scrim tap, handle tap and
 * hardware back close too. Its resting state is fully visible — the animations
 * only decorate it. Motion rules: AGENTS.md#conventions.
 */
export const Sheet = ({
  visible,
  onClose,
  children,
  snapPoints = DEFAULT_SNAP_POINTS,
  expandable = true,
}: Props) => {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const initial = computeStops(snapPoints, windowHeight, expandable);

  const height = useSharedValue(initial.min);
  const offset = useSharedValue(0);
  const bounds = useSharedValue<Bounds>(initial);
  const startHeight = useSharedValue(initial.min);
  const [ctl] = useState(() => makeController(height, offset, bounds));
  const [pan] = useState(() => makePan(height, offset, bounds, startHeight, ctl.close));

  useEffect(() => {
    ctl.setOnClose(onClose);
  }, [ctl, onClose]);

  useEffect(() => {
    ctl.setBounds(computeStops(snapPoints, windowHeight, expandable));
  }, [ctl, snapPoints, windowHeight, expandable]);

  useEffect(() => {
    if (visible) ctl.enter();
  }, [visible, ctl]);

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: SCRIM_OPACITY * (1 - offset.value / Math.max(1, height.value)),
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    height: height.value,
    transform: [{ translateY: offset.value }],
  }));

  const onHandlePress = () => {
    if (initial.stops.length > 1) ctl.toggle();
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
        <Animated.View style={scrimStyle} className="absolute inset-0 bg-black">
          <Pressable className="flex-1" onPress={ctl.close} accessibilityRole="button" />
        </Animated.View>
        <Animated.View
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
              <View className="h-1 w-10 rounded-full bg-ink-600" />
            </Pressable>
          </GestureDetector>
          {children}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
};
