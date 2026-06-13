import { useEffect, useState } from 'react';
import { Animated, type ViewProps } from 'react-native';

type Props = ViewProps & { delay?: number; children: React.ReactNode };

/**
 * Mount entrance — a calm fade paired with a subtle scale-up from the element's
 * own center (0.97 → 1). The content "settles in place" rather than sweeping
 * down the screen: a pure top-to-bottom stagger read as if everything flew in
 * from the top. The stagger is capped hard so sections feel like one unified
 * appearance instead of a visible cascade.
 */
export const FadeInUp = ({ delay = 0, children, style, ...rest }: Props) => {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Cap the stagger tightly so the screen reads as one calm entrance.
    const d = Math.min(delay, 90);
    Animated.timing(progress, {
      toValue: 1,
      duration: 260,
      delay: d,
      useNativeDriver: true,
    }).start();
  }, [progress, delay]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] });

  return (
    <Animated.View style={[{ opacity: progress, transform: [{ scale }] }, style]} {...rest}>
      {children}
    </Animated.View>
  );
};
