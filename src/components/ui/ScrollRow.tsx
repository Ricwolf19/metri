import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewStyle,
} from 'react-native';

import { hiddenEnds, type Surface } from './edge-fade';
import { EdgeFade } from './EdgeFade';

type Props = {
  children: React.ReactNode;
  /** Classes for the item row itself; defaults to `gap-2`. */
  className?: string;
  contentStyle?: ViewStyle;
  /**
   * A content x to put in the middle of the frame on the first layout — for a
   * strip whose natural start is its centre (the rest shortcuts open on the
   * −30 s | +30 s seam, the common taps, and scroll outward to the extremes).
   */
  centerX?: number;
  /**
   * A content x to keep in view as it changes — the selected chip of a strip
   * that doubles as navigation. Unlike `centerX` it follows every change, so
   * the current item is never parked off the edge.
   */
  focusX?: number;
  /**
   * The fill behind the row, for one placed straight on a box that paints its
   * own. Usually omitted: the fade reads what the nearest `Card`, `Sheet` or
   * `<OnSurface>` declared.
   */
  surface?: Surface;
};

/**
 * Slack before an edge counts as reached. Generous on purpose: the fade sits on
 * top of the row, so a few pixels of unreached scroll are not worth dissolving
 * the first or last item.
 */
const EDGE = 12;

/**
 * One line of content that scrolls sideways when it overflows, its edge
 * dissolving into the surface behind it wherever something is still hidden
 * there. A row rather than a wrapping strip: wrapped badges grow downwards and
 * push the content the screen is about below the fold. The fade takes no room
 * of its own, so the row keeps its full width for content.
 */
export const ScrollRow = ({
  children,
  className,
  contentStyle,
  centerX,
  focusX,
  surface,
}: Props) => {
  const ref = useRef<ScrollView>(null);
  const [frame, setFrame] = useState(0);
  const [content, setContent] = useState(0);
  const [offset, setOffset] = useState(0);
  const centered = useRef(false);

  // Once per mount, as soon as both sizes are known: the row is a native
  // scroll view, so the initial position is an imperative call, not a prop.
  // The scroll event it emits updates the fades like any other scroll.
  useEffect(() => {
    if (centered.current || centerX == null || !frame || !content) return;
    centered.current = true;
    ref.current?.scrollTo({
      x: Math.max(0, Math.min(content - frame, centerX - frame / 2)),
      animated: false,
    });
  }, [centerX, frame, content]);

  useEffect(() => {
    if (focusX == null || !frame || !content) return;
    ref.current?.scrollTo({
      x: Math.max(0, Math.min(content - frame, focusX - frame / 2)),
      animated: true,
    });
  }, [focusX, frame, content]);

  const hidden = hiddenEnds(frame, content, offset, EDGE);

  // Every scroll event carries the current geometry, so the fades cannot go
  // stale: `onScroll` alone misses the last frame of a fling, which once left
  // the edge cue sitting over the very item the user had just scrolled to.
  const track = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    setOffset(contentOffset.x);
    setFrame(layoutMeasurement.width);
    setContent(contentSize.width);
  };

  return (
    <View>
      <ScrollView
        ref={ref}
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
      {hidden.start ? <EdgeFade edge="left" surface={surface} /> : null}
      {hidden.end ? <EdgeFade edge="right" surface={surface} /> : null}
    </View>
  );
};
