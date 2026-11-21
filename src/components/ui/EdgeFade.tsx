import { View } from 'react-native';

import { fadeStyle, type FadeEdge, type Surface } from './edge-fade';
import { useSurface } from './surface';

/**
 * A soft gradient over one edge of a scroller, in the colour of the surface
 * behind it: the content dissolves there, which says "more this way" without
 * an icon taking room or a tap target the lifter would aim for. Drawn by the
 * New Architecture's native `experimental_backgroundImage` (no SVG, no extra
 * dependency). Decorative and static: never animated, never touchable, and an
 * empty view a screen reader passes over.
 */
export const EdgeFade = ({ edge, surface }: { edge: FadeEdge; surface?: Surface }) => {
  const declared = useSurface();
  return <View pointerEvents="none" style={fadeStyle(surface ?? declared, edge)} />;
};
