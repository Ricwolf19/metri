import { Animated, Pressable, type PressableProps } from 'react-native';

import { usePressScale } from '@/lib/usePressScale';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & { scaleTo?: number; children: React.ReactNode };

/** A Pressable that springs down slightly on press — for tappable cards/rows. */
export const PressableScale = ({ scaleTo, onPressIn, onPressOut, children, ...rest }: Props) => {
  const { scale, onPressIn: scaleIn, onPressOut: scaleOut } = usePressScale(scaleTo);

  return (
    <AnimatedPressable
      style={{ transform: [{ scale }] }}
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
