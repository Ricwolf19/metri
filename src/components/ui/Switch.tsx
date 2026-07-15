import { useEffect, useState } from 'react';
import { Animated, Pressable } from 'react-native';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

/** Themed toggle — matches the Select/Input surfaces (lime track when on). */
export const Switch = ({ value, onValueChange, disabled = false }: Props) => {
  // useState (not useRef) so the Animated.Value is readable during render
  // without tripping the refs-in-render lint (same pattern as Toast).
  const [anim] = useState(() => new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [value, anim]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      hitSlop={6}
      className={[
        'h-7 w-12 justify-center rounded-full p-0.5',
        value ? 'bg-brand' : 'bg-ink-600',
        disabled ? 'opacity-50' : '',
      ].join(' ')}
    >
      <Animated.View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#fafafa',
          transform: [{ translateX }],
        }}
      />
    </Pressable>
  );
};
