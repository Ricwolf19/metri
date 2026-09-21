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

import { BrandMark } from './BrandMark';
import { Scrim } from './Scrim';

type Props = { visible: boolean; label?: string };

/**
 * Full-screen wait for the few synchronous transitions the app cannot avoid
 * (language switch, starting or saving a workout).
 *
 * It is a `Modal`, not an absolute view: as a child of a scrolling `Screen` an
 * absolute overlay anchors to the CONTENT, so on a scrolled page the mark
 * drifted off centre or off screen entirely. The modal always covers the
 * viewport, which is also what makes the blur cover everything.
 */
export const BlockingOverlay = ({ visible, label }: Props) => {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    pulse.value = 0;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
    // Uncancelled, the repeat keeps running on the UI thread for the life of
    // the app once the overlay closes.
    return () => cancelAnimation(pulse);
  }, [visible, pulse]);

  const markAnim = useAnimatedStyle(() => ({
    opacity: 0.65 + pulse.value * 0.35,
    transform: [{ scale: 0.96 + pulse.value * 0.08 }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <Scrim depth="full">
        <View
          className="flex-1 items-center justify-center px-10"
          accessibilityLiveRegion="polite"
          accessibilityRole="progressbar"
        >
          <Animated.View style={markAnim}>
            <BrandMark size={64} />
          </Animated.View>
          {label ? (
            <Text className="mt-5 text-center text-sm leading-5 text-ink-200">{label}</Text>
          ) : null}
        </View>
      </Scrim>
    </Modal>
  );
};
