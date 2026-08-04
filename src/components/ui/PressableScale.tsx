import { Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { usePressScale } from '@/lib/usePressScale';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & { scaleTo?: number; children: React.ReactNode };

/** A Pressable that springs down slightly on press — for tappable cards/rows. */
export const PressableScale = ({ scaleTo, onPressIn, onPressOut, children, ...rest }: Props) => {
  const { scale, onPressIn: scaleIn, onPressOut: scaleOut } = usePressScale(scaleTo);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      style={anim}
      onPressIn={(e) => {
        scaleIn();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scaleOut();
        onPressOut?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
};
