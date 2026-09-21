import { useEffect, useState } from 'react';
import { Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

import { useTheme } from '@/theme/theme-context';

import { Scrim } from './Scrim';

type Props = {
  visible: boolean;
  /** Runs when the ring empties, the card is swiped away, or back is pressed. */
  onDone: () => void;
  /** How long the ring takes to empty. */
  durationMs?: number;
  children: React.ReactNode;
};

const RADIUS = 20;
const STROKE = 3;
const DISMISS_DX = 90;
const DISMISS_VX = 700;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const perimeter = (w: number, h: number) =>
  Math.max(1, 2 * (w + h) - 8 * RADIUS + 2 * Math.PI * RADIUS);

// Shared-value writes stay in module-scope factories (AGENTS.md#architecture-invariants).
const makeController = (life: SharedValue<number>, panX: SharedValue<number>) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let duration = 8000;
  let width = 0;
  let done = () => {};
  const stop = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  // Ring and timeout always move together, so the ring never lies about the wait.
  const run = (fraction: number) => {
    stop();
    const ms = Math.max(400, fraction * duration);
    life.value = withTiming(0, { duration: ms, easing: Easing.linear });
    timer = setTimeout(() => done(), ms);
  };
  return {
    configure: (nextDuration: number, nextWidth: number, nextDone: () => void) => {
      duration = nextDuration;
      width = nextWidth;
      done = nextDone;
    },
    start: () => {
      panX.value = 0;
      life.value = 1;
      run(1);
    },
    freeze: () => {
      stop();
      cancelAnimation(life);
    },
    thaw: () => run(life.value),
    settle: () => {
      panX.value = withTiming(0, { duration: 160, easing: Easing.out(Easing.cubic) });
      run(life.value);
    },
    leave: (dir: number) => {
      stop();
      panX.value = withTiming(dir * width, { duration: 160 }, (finished) => {
        if (finished) runOnJS(done)();
      });
    },
    clear: stop,
  };
};

type Controller = ReturnType<typeof makeController>;

const makePan = (panX: SharedValue<number>, ctl: Controller) =>
  Gesture.Pan()
    // Let plain taps through to the card, which owns freeze/resume.
    .activeOffsetX([-12, 12])
    .failOffsetY([-14, 14])
    .onStart(() => runOnJS(ctl.freeze)())
    .onUpdate((e) => {
      panX.value = e.translationX;
    })
    .onEnd((e) => {
      const leaving = Math.abs(e.translationX) > DISMISS_DX || Math.abs(e.velocityX) > DISMISS_VX;
      if (leaving) {
        runOnJS(ctl.leave)(Math.sign(e.translationX || e.velocityX) || 1);
        return;
      }
      runOnJS(ctl.settle)();
    });

/**
 * A centred card that closes itself: the ring around its border empties over
 * `durationMs`, then `onDone`. Tapping freezes the ring so a long list can be
 * read, tapping again resumes, a swipe either way leaves at once. For showing a
 * result the user already asked for — it carries no decision, so it has no
 * buttons.
 */
export const TimedModal = ({ visible, onDone, durationMs = 8000, children }: Props) => {
  const { brand } = useTheme();
  const { width: screenW } = useWindowDimensions();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [frozen, setFrozen] = useState(false);

  const life = useSharedValue(1);
  const panX = useSharedValue(0);
  const [ctl] = useState(() => makeController(life, panX));
  const [pan] = useState(() => makePan(panX, ctl));

  // Derived during render, not in an effect: every open starts unfrozen.
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) setFrozen(false);
  }

  useEffect(() => {
    ctl.configure(durationMs, screenW, onDone);
  }, [ctl, durationMs, screenW, onDone]);

  useEffect(() => {
    if (!visible) return;
    ctl.start();
    return ctl.clear;
  }, [visible, ctl]);

  const toggleFreeze = () => {
    setFrozen((was) => {
      if (was) ctl.thaw();
      else ctl.freeze();
      return !was;
    });
  };

  const cardAnim = useAnimatedStyle(() => ({
    transform: [{ translateX: panX.value }],
    opacity: 1 - Math.min(1, Math.abs(panX.value) / (screenW * 0.7)) * 0.6,
  }));

  const total = perimeter(size.w, size.h);
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: total * (1 - life.value) }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDone}
    >
      <Scrim depth="medium">
        {/* A Modal is its own native view tree: gestures need a root inside it. */}
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View className="flex-1 items-center justify-center px-8">
            <GestureDetector gesture={pan}>
              <Animated.View style={cardAnim} className="w-full">
                <Pressable
                  onPress={toggleFreeze}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: !frozen }}
                  onLayout={(e) =>
                    setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
                  }
                  className="overflow-hidden rounded-[20px] border border-ink-700 bg-ink-850 p-6"
                >
                  {children}
                </Pressable>

                {size.w > 0 ? (
                  <Svg
                    pointerEvents="none"
                    width={size.w}
                    height={size.h}
                    style={{ position: 'absolute', top: 0, left: 0 }}
                  >
                    <AnimatedRect
                      x={STROKE / 2}
                      y={STROKE / 2}
                      width={size.w - STROKE}
                      height={size.h - STROKE}
                      rx={RADIUS}
                      fill="none"
                      stroke={brand}
                      strokeWidth={STROKE}
                      strokeLinecap="round"
                      strokeDasharray={total}
                      animatedProps={ringProps}
                    />
                  </Svg>
                ) : null}
              </Animated.View>
            </GestureDetector>
          </View>
        </GestureHandlerRootView>
      </Scrim>
    </Modal>
  );
};
