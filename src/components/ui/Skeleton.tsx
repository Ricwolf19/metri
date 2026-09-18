import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Props = { className?: string };

/** Placeholder block with a slow opacity pulse — shown while a live query has not produced its first result. */
export const Skeleton = ({ className }: Props) => {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 700 }), withTiming(0, { duration: 700 })),
      -1,
    );
  }, [pulse]);
  const anim = useAnimatedStyle(() => ({ opacity: 0.45 + pulse.value * 0.35 }));
  return (
    <Animated.View
      style={anim}
      className={['rounded-field bg-ink-800', className ?? ''].join(' ')}
    />
  );
};
