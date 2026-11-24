import { useState } from 'react';
import {
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
  type ViewStyle,
} from 'react-native';

import { hiddenEnds, type Surface } from './edge-fade';
import { EdgeFade } from './EdgeFade';
import { SHEET_END, SHEET_GUTTER } from './gutter';
import { useSheetBleed } from './sheet-bottom';

type Props = ScrollViewProps & {
  /** Handle for imperative scrolls (e.g. a picker revealing its checked option). */
  ref?: React.Ref<ScrollView>;
  /** Height cap outside a sheet. Inside a sheet the sheet itself caps the height. */
  maxHeight?: number;
  /** Size to the sheet's content (shrinking when the sheet caps it). NOT
   * `flex: 1` — that would fill the cap and bring back the dead space under
   * short option lists. As the sheet's last child it runs through the sheet's
   * bottom safe-area padding to the physical edge (`sheet-bottom.tsx`). */
  inSheet?: boolean;
  /**
   * Something follows the list in its sheet (a footer): it stops above the
   * sheet's bottom safe area as it used to, and the footer sits on that padding.
   * Without it the list's negative margin would pull the footer over its end.
   */
  beforeFooter?: boolean;
  /**
   * The fill behind the list, for one placed straight on a box that paints its
   * own. Usually omitted: the fade reads what the nearest `Sheet`, `Card` or
   * `<OnSurface>` declared.
   */
  surface?: Surface;
  /** On the outer box. In a sheet never a bottom padding: it would stop the list
   * short of the sheet's edge again — pad the content instead. */
  className?: string;
  children: React.ReactNode;
};

/** Unreached scroll ignored before an edge fades, so a nudge of a list does not. */
const EDGE = 6;

/**
 * A bounded scroll view that tells the user there is more: the edge that still
 * has content (bottom and/or top) dissolves into the surface behind it. Static
 * on purpose — the list's resting state is the hint, nothing has to animate.
 * Inside a `<Sheet>` pass `inSheet`: it hugs its content up to the sheet's cap
 * and, as the sheet's last child, runs to its physical bottom, the last row
 * padded clear of the bar. Taps on its buttons keep the keyboard up by default.
 */
export const ScrollArea = ({
  ref,
  maxHeight,
  inSheet = false,
  beforeFooter = false,
  keyboardShouldPersistTaps = 'handled',
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
  // The sheet's bottom safe area: the list reaches through it, its content
  // passing under the navigation bar to fade at the sheet's physical edge.
  const { inset: bleed, covered } = useSheetBleed(inSheet && !beforeFooter);
  const box: ViewStyle = !inSheet
    ? { maxHeight }
    : bleed
      ? { flexShrink: 1, marginBottom: -bleed }
      : { flexShrink: 1 };

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
    <View style={box} className={className}>
      {/* The fades anchor to the list itself, not to the box above: a caller's
          padding (`pb-6`) would otherwise draw the bottom one over that padding. */}
      <View style={{ flexShrink: 1 }}>
        <ScrollView
          // Android 12+'s stretch overscroll catches the next touch while it
          // relaxes: a sideways swipe on a strip inside, right after a drag of
          // the list, went to the list and the strip never moved.
          overScrollMode="never"
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
            inSheet ? { paddingHorizontal: SHEET_GUTTER, paddingBottom: SHEET_END } : null,
            contentContainerStyle,
          ]}
        >
          {children}
          {/* The room the bleed took from under the last row, after anything a
              caller pads: it still scrolls clear of the navigation bar. */}
          {bleed ? <View style={{ height: bleed }} /> : null}
        </ScrollView>
        {hidden.start ? <EdgeFade edge="top" surface={surface} /> : null}
        {hidden.end ? <EdgeFade edge="bottom" surface={surface} covered={covered} /> : null}
      </View>
    </View>
  );
};
