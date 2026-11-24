import { View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { fadeStyle, type FadeEdge, type Surface } from './edge-fade';
import { useSurface } from './surface';

type Props = {
  edge: FadeEdge;
  surface?: Surface;
  /**
   * For a bottom fade: how much of the scroller's bottom something opaque
   * covers right now, on the UI thread — the keyboard over a sheet list that
   * runs through the sheet's bottom safe area (`ScrollArea`). The fade rides up
   * by it, so the list still dissolves right at the keyboard, not cut there.
   */
  covered?: SharedValue<number>;
};

/**
 * A soft gradient over one edge of a scroller, in the colour of the surface
 * behind it: the content dissolves there, which says "more this way" without
 * an icon taking room or a tap target the lifter would aim for. Drawn by the
 * New Architecture's native `experimental_backgroundImage` (no SVG, no extra
 * dependency). Decorative: never animated on its own (a riding one only follows
 * the keyboard), never touchable, and an empty view a screen reader passes over.
 */
export const EdgeFade = ({ edge, surface, covered }: Props) => {
  const declared = useSurface();
  const style = fadeStyle(surface ?? declared, edge);
  return covered ? (
    <RidingFade style={style} covered={covered} />
  ) : (
    <View pointerEvents="none" style={style} />
  );
};

/** The same fade, moved off what covers its edge: a transform, so it costs no layout. */
const RidingFade = ({ style, covered }: { style: ViewStyle; covered: SharedValue<number> }) => {
  const ride = useAnimatedStyle(() => ({ transform: [{ translateY: -covered.value }] }));
  return <Animated.View pointerEvents="none" style={[style, ride]} />;
};
