import { useEffect } from 'react';
import { Modal, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/theme/theme-context';

import { BrandMark } from './BrandMark';

type Props = { visible: boolean; label?: string };

const RING = 104;
const STROKE = 3;

/**
 * Full-screen wait for the few synchronous transitions the app cannot avoid
 * (language switch, starting, finishing or discarding a workout, a bulk write).
 *
 * It is a `Modal`, not an absolute view: as a child of a scrolling `Screen` an
 * absolute overlay anchors to the CONTENT, so on a scrolled page the mark
 * drifted off centre or off screen entirely. The backdrop is a SOLID surface,
 * not the scrim: a translucent wait showed the screens behind it mid-render
 * (half-built lists, a tab mounting), which read as a glitch. The mark pulses
 * inside a ring whose arc orbits it — the resting state is already centred and
 * visible; the motion only decorates.
 */
export const BlockingOverlay = ({ visible, label }: Props) => {
  const { brand } = useTheme();
  const pulse = useSharedValue(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    pulse.value = 0;
    spin.value = 0;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
    spin.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.linear }), -1);
    // Uncancelled, the repeats keep running on the UI thread for the life of
    // the app once the overlay closes.
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(spin);
    };
  }, [visible, pulse, spin]);

  const markAnim = useAnimatedStyle(() => ({
    opacity: 0.7 + pulse.value * 0.3,
    transform: [{ scale: 0.96 + pulse.value * 0.08 }],
  }));
  const ringAnim = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const r = (RING - STROKE) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View
        className="flex-1 items-center justify-center bg-ink-900 px-10"
        accessibilityLiveRegion="polite"
        accessibilityRole="progressbar"
      >
        <View style={{ width: RING, height: RING }} className="items-center justify-center">
          <Animated.View style={[{ position: 'absolute', width: RING, height: RING }, ringAnim]}>
            <Svg width={RING} height={RING}>
              <Circle
                cx={RING / 2}
                cy={RING / 2}
                r={r}
                stroke={brand}
                strokeWidth={STROKE}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${circumference * 0.28} ${circumference * 0.72}`}
                opacity={0.9}
              />
            </Svg>
          </Animated.View>
          <Animated.View style={markAnim}>
            <BrandMark size={56} />
          </Animated.View>
        </View>
        {label ? (
          <Text className="mt-6 text-center text-sm leading-5 text-ink-200">{label}</Text>
        ) : null}
      </View>
    </Modal>
  );
};
