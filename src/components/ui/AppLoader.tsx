import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { BrandMark } from './BrandMark';

/**
 * Branded loading screen — the icon mark gently breathing. Replaces the bare
 * spinner (and the stock Expo splash feel) during migrations / auth resolution.
 */
export const AppLoader = ({ size = 120 }: { size?: number }) => {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 950 }), withTiming(0, { duration: 950 })),
      -1,
    );
  }, [pulse]);

  const anim = useAnimatedStyle(() => ({
    opacity: 0.6 + pulse.value * 0.4,
    transform: [{ scale: 0.94 + pulse.value * 0.11 }],
  }));

  return (
    <View className="flex-1 items-center justify-center bg-ink-900">
      <Animated.View style={anim}>
        <BrandMark size={size} />
      </Animated.View>
    </View>
  );
};
