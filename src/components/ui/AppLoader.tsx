import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

import { BrandLogo } from './BrandLogo';

/**
 * Branded loading screen — a gently breathing Metri logo. Replaces the bare
 * spinner (and the stock Expo splash feel) during migrations / auth resolution.
 */
export const AppLoader = ({ size = 168 }: { size?: number }) => {
  const [scale] = useState(() => new Animated.Value(0.94));
  const [opacity] = useState(() => new Animated.Value(0.6));

  useEffect(() => {
    const pulse = (value: Animated.Value, to: number) =>
      Animated.timing(value, { toValue: to, duration: 950, useNativeDriver: true });
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([pulse(scale, 1.05), pulse(scale, 0.94)]),
        Animated.sequence([pulse(opacity, 1), pulse(opacity, 0.6)]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity]);

  return (
    <View className="flex-1 items-center justify-center bg-ink-900">
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <BrandLogo width={size} />
      </Animated.View>
    </View>
  );
};
