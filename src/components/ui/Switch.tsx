import { useEffect, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';

type Size = 'sm' | 'md';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: Size;
  /** Announced by screen readers — pass the setting's name. */
  accessibilityLabel?: string;
};

const DIMENSIONS: Record<Size, { track: [number, number]; thumb: number; pad: number }> = {
  sm: { track: [40, 24], thumb: 18, pad: 3 },
  md: { track: [48, 28], thumb: 24, pad: 2 },
};

/**
 * Themed toggle: the thumb springs between sides and stretches while pressed,
 * the track crossfades ink→lime. All native-driver — the lime track is an
 * overlay whose opacity rides the same value as the thumb, so color and motion
 * cannot drift apart.
 */
export const Switch = ({
  value,
  onValueChange,
  disabled = false,
  size = 'md',
  accessibilityLabel,
}: Props) => {
  const { track, thumb, pad } = DIMENSIONS[size];
  const travel = track[0] - thumb - pad * 2;

  // useState (not useRef) so the Animated.Values are readable during render
  // without tripping the refs-in-render lint (same pattern as Toast).
  const [anim] = useState(() => new Animated.Value(value ? 1 : 0));
  const [press] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(anim, {
      toValue: value ? 1 : 0,
      speed: 20,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  }, [value, anim]);

  const setPressed = (down: boolean) => {
    Animated.timing(press, {
      toValue: down ? 1 : 0,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, travel] });
  const scaleX = press.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      onPressIn={() => !disabled && setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      hitSlop={8}
      disabled={disabled}
      style={{ width: track[0], height: track[1] }}
      className={disabled ? 'opacity-50' : ''}
    >
      {/* Track: ink base + lime overlay crossfaded by the same value as the thumb. */}
      <View className="absolute inset-0 rounded-full bg-ink-600" />
      <Animated.View
        pointerEvents="none"
        style={{ opacity: anim }}
        className="absolute inset-0 rounded-full bg-brand"
      />
      <Animated.View
        style={{
          position: 'absolute',
          top: pad,
          left: pad,
          width: thumb,
          height: thumb,
          borderRadius: thumb / 2,
          backgroundColor: '#fafafa',
          transform: [{ translateX }, { scaleX }],
          elevation: 2,
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
        }}
      />
    </Pressable>
  );
};
