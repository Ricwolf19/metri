import { useState } from 'react';
import { Animated } from 'react-native';

/**
 * Springy press feedback — scales a view down on press-in and back on release.
 * Built on RN's Animated (no worklets/babel plugin needed). Returns the animated
 * value plus the press handlers to spread onto a Pressable.
 */
export const usePressScale = (to = 0.97) => {
  const [scale] = useState(() => new Animated.Value(1));

  const spring = (toValue: number) =>
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 40, bounciness: 4 }).start();

  return {
    scale,
    onPressIn: () => spring(to),
    onPressOut: () => spring(1),
  };
};
