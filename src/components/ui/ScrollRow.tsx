import { useState } from 'react';
import {
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewStyle,
} from 'react-native';

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import { useTheme } from '@/theme/theme-context';

type Props = {
  children: React.ReactNode;
  /** Classes for the item row itself; defaults to `gap-2`. */
  className?: string;
  contentStyle?: ViewStyle;
};

/**
 * Slack before an edge counts as reached. Generous on purpose: the cue sits on
 * top of the row, so a few pixels of unreached scroll are not worth hiding the
 * first or last item behind a chevron.
 */
const EDGE = 12;

const Cue = ({ side }: { side: 'left' | 'right' }) => {
  const { muted } = useTheme();
  return (
    <View
      pointerEvents="none"
      className={[
        'absolute top-0 h-full justify-center',
        side === 'left' ? 'left-0' : 'right-0',
      ].join(' ')}
    >
      <View className="rounded-full bg-ink-900/90 p-0.5">
        {side === 'left' ? (
          <ChevronLeftIcon color={muted} size={13} />
        ) : (
          <ChevronRightIcon color={muted} size={13} />
        )}
      </View>
    </View>
  );
};

/**
 * One line of content that scrolls sideways when it overflows, with a small
 * static chevron on whichever edge still has something behind it. A row rather
 * than a wrapping strip: wrapped badges grow downwards and push the content the
 * screen is about below the fold.
 */
export const ScrollRow = ({ children, className, contentStyle }: Props) => {
  const [frame, setFrame] = useState(0);
  const [content, setContent] = useState(0);
  const [offset, setOffset] = useState(0);

  const overflowing = content > frame + 1;
  const canRight = overflowing && content - frame - offset > EDGE;
  const canLeft = overflowing && offset > EDGE;

  // Every scroll event carries the current geometry, so the cues cannot go
  // stale: `onScroll` alone misses the last frame of a fling, which left a
  // chevron sitting over the very item the user had just scrolled to.
  const track = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    setOffset(contentOffset.x);
    setFrame(layoutMeasurement.width);
    setContent(contentSize.width);
  };

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={track}
        onScrollEndDrag={track}
        onMomentumScrollEnd={track}
        scrollEventThrottle={16}
        onLayout={(e) => setFrame(e.nativeEvent.layout.width)}
        onContentSizeChange={(w) => setContent(w)}
        contentContainerStyle={contentStyle}
      >
        <View className={['flex-row items-center', className ?? 'gap-2'].join(' ')}>
          {children}
        </View>
      </ScrollView>
      {canLeft ? <Cue side="left" /> : null}
      {canRight ? <Cue side="right" /> : null}
    </View>
  );
};
