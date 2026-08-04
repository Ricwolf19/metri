import { useEffect } from 'react';
import { type ViewProps } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

type Props = ViewProps & { delay?: number; children: React.ReactNode };

/**
 * Mount entrance — a calm fade paired with a subtle scale-up from the element's
 * own center (0.97 → 1). The content "settles in place" rather than sweeping
 * down the screen. The stagger is capped hard so sections feel like one unified
 * appearance instead of a visible cascade. Runs on the UI thread (reanimated).
 */
export const FadeInUp = ({ delay = 0, children, style, ...rest }: Props) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    // Cap the stagger tightly so the screen reads as one calm entrance.
    progress.value = withDelay(Math.min(delay, 90), withTiming(1, { duration: 260 }));
  }, [progress, delay]);

  const anim = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.97, 1]) }],
  }));

  return (
    <Animated.View style={[anim, style]} {...rest}>
      {children}
    </Animated.View>
  );
};
