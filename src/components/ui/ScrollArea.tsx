import { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ChevronDownIcon } from '@/components/icons';
import { useTheme } from '@/theme/theme-context';

type Props = ScrollViewProps & { maxHeight: number; className?: string; children: React.ReactNode };

const EDGE = 6;

const Hint = ({ up }: { up: boolean }) => {
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
  const anim = useAnimatedStyle(() => ({
    transform: [
      { translateY: (up ? -1 : 1) * nudge.value * 4 },
      { rotate: up ? '180deg' : '0deg' },
    ],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', right: 6 }, up ? { top: 2 } : { bottom: 2 }, anim]}
      className="h-6 w-6 items-center justify-center rounded-full bg-ink-700/90"
    >
      <ChevronDownIcon color={brand} size={14} />
    </Animated.View>
  );
};

/**
 * A bounded ScrollView that tells the user there is more: a gently nudging
 * chevron appears at the edge that still has content (bottom and/or top).
 */
export const ScrollArea = ({ maxHeight, className, children, onScroll, ...rest }: Props) => {
  const [viewport, setViewport] = useState(0);
  const [content, setContent] = useState(0);
  const [offset, setOffset] = useState(0);

  const canDown = content - viewport - offset > EDGE;
  const canUp = offset > EDGE;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setOffset(e.nativeEvent.contentOffset.y);
    onScroll?.(e);
  };

  return (
    <View style={{ maxHeight }} className={className}>
      <ScrollView
        {...rest}
        showsVerticalScrollIndicator={false}
        onLayout={(e) => setViewport(e.nativeEvent.layout.height)}
        onContentSizeChange={(_, h) => setContent(h)}
        onScroll={handleScroll}
        scrollEventThrottle={32}
      >
        {children}
      </ScrollView>
      {canDown ? <Hint up={false} /> : null}
      {canUp ? <Hint up /> : null}
    </View>
  );
};
