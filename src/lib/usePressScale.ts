import { useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';

const SPRING = { damping: 20, stiffness: 400 };

/**
 * Springy press feedback — scales a view down on press-in and back on release.
 * Runs on the UI thread via reanimated shared values. Returns the shared value
 * plus the press handlers to spread onto a Pressable.
 */
export const usePressScale = (
  to = 0.97,
): { scale: SharedValue<number>; onPressIn: () => void; onPressOut: () => void } => {
  const scale = useSharedValue(1);

  return {
    scale,
    onPressIn: () => {
      scale.value = withSpring(to, SPRING);
    },
    onPressOut: () => {
      scale.value = withSpring(1, SPRING);
    },
  };
};
