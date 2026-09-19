import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronDownIcon } from '@/components/icons';
import { useTheme } from '@/theme/theme-context';

type Props = ScrollViewProps & {
  /** Height cap outside a sheet. Inside a sheet the sheet itself caps the height. */
  maxHeight?: number;
  /** Render with the sheet-aware scroll view so drags scroll instead of moving the sheet. */
  inSheet?: boolean;
  className?: string;
  children: React.ReactNode;
};

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
 * A bounded scroll view that tells the user there is more: a gently nudging
 * chevron appears at the edge that still has content (bottom and/or top).
 * Inside a `<Sheet>` pass `inSheet` (the sheet's own scrollable, safe-area padded).
 */
export const ScrollArea = ({
  maxHeight,
  inSheet = false,
  className,
  children,
  onScroll,
  contentContainerStyle,
  ...rest
}: Props) => {
  const insets = useSafeAreaInsets();
  const [viewport, setViewport] = useState(0);
  const [content, setContent] = useState(0);
  const [offset, setOffset] = useState(0);

  const measured = viewport > 0 && content > 0;
  const canDown = measured && content - viewport - offset > EDGE;
  const canUp = measured && offset > EDGE;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setOffset(e.nativeEvent.contentOffset.y);
    onScroll?.(e);
  };

  const Scroller = inSheet ? BottomSheetScrollView : ScrollView;
  return (
    <View style={inSheet ? { flex: 1 } : { maxHeight }} className={className}>
      <Scroller
        {...rest}
        showsVerticalScrollIndicator={false}
        onLayout={(e) => setViewport(e.nativeEvent.layout.height)}
        onContentSizeChange={(_, h) => setContent(h)}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        contentContainerStyle={[
          inSheet ? { paddingHorizontal: 20, paddingBottom: insets.bottom + 20 } : null,
          contentContainerStyle,
        ]}
      >
        {children}
      </Scroller>
      {canDown ? <Hint up={false} /> : null}
      {canUp ? <Hint up /> : null}
    </View>
  );
};
