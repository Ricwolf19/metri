import { useEffect, useState } from 'react';
import { Animated, type ViewProps } from 'react-native';

type Props = ViewProps & { delay?: number; children: React.ReactNode };

/**
 * Mount entrance — a gentle opacity fade (no movement). A pure fade reads as
 * smooth; sliding/translating staggered lists looked like a "flash" sweeping
 * down the screen, so we keep it calm.
 */
export const FadeInUp = ({ delay = 0, children, style, ...rest }: Props) => {
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Cap the stagger so long lists don't visibly cascade.
    const d = Math.min(delay, 160);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      delay: d,
      useNativeDriver: true,
    }).start();
  }, [opacity, delay]);

  return (
    <Animated.View style={[{ opacity }, style]} {...rest}>
      {children}
    </Animated.View>
  );
};
