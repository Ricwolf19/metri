import { useState } from 'react';
import {
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from 'react-native';

import { hiddenEnds, type Surface } from './edge-fade';
import { EdgeFade } from './EdgeFade';

type Props = ScrollViewProps & {
  /** Handle for imperative scrolls (e.g. a picker revealing its checked option). */
  ref?: React.Ref<ScrollView>;
  /** Height cap outside a sheet. Inside a sheet the sheet itself caps the height. */
  maxHeight?: number;
  /** Size to the sheet's content (shrinking when the sheet caps it). NOT
   * `flex: 1` — that would fill the cap and bring back the dead space under
   * short option lists. The sheet pads the safe area itself. */
  inSheet?: boolean;
  /**
   * The fill behind the list, for one placed straight on a box that paints its
   * own. Usually omitted: the fade reads what the nearest `Sheet`, `Card` or
   * `<OnSurface>` declared.
   */
  surface?: Surface;
  className?: string;
  children: React.ReactNode;
};

/** Unreached scroll ignored before an edge fades, so a nudge of a list does not. */
const EDGE = 6;

/**
 * A bounded scroll view that tells the user there is more: the edge that still
 * has content (bottom and/or top) dissolves into the surface behind it. Static
 * on purpose — the list's resting state is the hint, nothing has to animate.
 * Inside a `<Sheet>` pass `inSheet` (fills the sheet; the sheet pads the safe area).
 */
export const ScrollArea = ({
  ref,
  maxHeight,
  inSheet = false,
  surface,
  className,
  children,
  onScroll,
  onScrollEndDrag,
  onMomentumScrollEnd,
  onLayout,
  onContentSizeChange,
  contentContainerStyle,
  ...rest
}: Props) => {
  const [viewport, setViewport] = useState(0);
  const [content, setContent] = useState(0);
  const [offset, setOffset] = useState(0);

  const hidden = hiddenEnds(viewport, content, offset, EDGE);

  // Every scroll event carries the whole geometry, and the ends of a drag and
  // of a fling re-read it too: a throttled `onScroll` misses the last frame of
  // a fling, which would leave the bottom fade over the last option.
  const track = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    setOffset(contentOffset.y);
    setViewport(layoutMeasurement.height);
    setContent(contentSize.height);
  };

  return (
    <View style={inSheet ? { flexShrink: 1 } : { maxHeight }} className={className}>
      {/* The fades anchor to the list itself, not to the box above: a caller's
          padding (`pb-6`) would otherwise draw the bottom one over that padding. */}
      <View style={{ flexShrink: 1 }}>
        <ScrollView
          {...rest}
          ref={ref}
          showsVerticalScrollIndicator={false}
          // Chained like the scroll handlers: overriding them dropped a caller's.
          onLayout={(e) => {
            setViewport(e.nativeEvent.layout.height);
            onLayout?.(e);
          }}
          onContentSizeChange={(w, h) => {
            setContent(h);
            onContentSizeChange?.(w, h);
          }}
          onScroll={(e) => {
            track(e);
            onScroll?.(e);
          }}
          onScrollEndDrag={(e) => {
            track(e);
            onScrollEndDrag?.(e);
          }}
          onMomentumScrollEnd={(e) => {
            track(e);
            onMomentumScrollEnd?.(e);
          }}
          scrollEventThrottle={32}
          contentContainerStyle={[
            inSheet ? { paddingHorizontal: 20, paddingBottom: 20 } : null,
            contentContainerStyle,
          ]}
        >
          {children}
        </ScrollView>
        {hidden.start ? <EdgeFade edge="top" surface={surface} /> : null}
        {hidden.end ? <EdgeFade edge="bottom" surface={surface} /> : null}
      </View>
    </View>
  );
};
