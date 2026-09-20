import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ChevronRightIcon } from '@/components/icons';
import { useTheme } from '@/theme/theme-context';

export type ChipItem<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  items: ChipItem<T>[];
  /** null renders every chip unselected — "you still have to choose". */
  value: T | null;
  onChange: (value: T) => void;
};

const EDGE = 6;

// Same nudge language as ScrollArea's vertical hint, rotated to the x-axis.
const Hint = () => {
  const { brand } = useTheme();
  const nudge = useSharedValue(0);
  useEffect(() => {
    nudge.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 550, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 550, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [nudge]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: nudge.value * 3 }] }));

  return (
    <Animated.View
      pointerEvents="none"
      style={style}
      className="absolute right-0 top-0 h-full justify-center"
    >
      <View className="rounded-full bg-ink-900/90 p-0.5">
        <ChevronRightIcon color={brand} size={14} />
      </View>
    </Animated.View>
  );
};

/**
 * Single-select chip row that scrolls horizontally when the options overflow;
 * an animated edge chevron says "there is more to the right" (the app's
 * standard partial-content hint).
 */
export const ChipRow = <T extends string>({ items, value, onChange }: Props<T>) => {
  const [frameWidth, setFrameWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [atEnd, setAtEnd] = useState(false);
  const overflowing = contentWidth > frameWidth + 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    setAtEnd(contentOffset.x + layoutMeasurement.width >= contentSize.width - EDGE);
  };

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={64}
        onLayout={(e) => setFrameWidth(e.nativeEvent.layout.width)}
        onContentSizeChange={(w) => setContentWidth(w)}
      >
        <View className="flex-row gap-2">
          {items.map((item) => {
            const active = item.value === value;
            return (
              <Pressable
                key={item.value}
                onPress={() => onChange(item.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                className={[
                  'rounded-full border px-4 py-2',
                  active ? 'border-brand/40 bg-brand/15' : 'border-ink-700 bg-ink-800',
                ].join(' ')}
              >
                <Text
                  className={[
                    'text-sm font-sans-semibold',
                    active ? 'text-brand' : 'text-ink-300',
                  ].join(' ')}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      {overflowing && !atEnd ? <Hint /> : null}
    </View>
  );
};
