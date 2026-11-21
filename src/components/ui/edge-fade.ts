import type { ViewStyle } from 'react-native';

import { tokenRgba } from '@/theme/tokens';

/**
 * The fill a piece of UI sits on, named the way `Card` names its own: `base`
 * is the screen and every sheet (ink-900), `raised` a card (ink-800), `sunken`
 * the inset box inside one (ink-850). Whatever paints the fill declares it
 * (`surface.tsx`), so an edge fade melts into the colour actually behind it.
 */
export type Surface = 'base' | 'raised' | 'sunken';

/** The theme token each surface paints: the classes Screen/Sheet and Card use. */
const SURFACE_TOKEN: Record<Surface, string> = {
  base: '--ink-900',
  raised: '--ink-800',
  sunken: '--ink-850',
};

export type FadeEdge = 'left' | 'right' | 'top' | 'bottom';

/**
 * How far the fade reaches in from its edge. An area's is deep enough that its
 * solid band (`STOPS`) covers the glyphs a 44 dp row cuts at the clip; a row's
 * stays narrow, so it never hides a short chip outright.
 */
export const FADE_SIZE = { row: 24, area: 36 } as const;

/**
 * Which ends of a scroller still hide content, from the frame, the content and
 * the offset along its axis. `slack` is how much unreached scroll is ignored:
 * a few pixels are not worth fading the first or last item.
 */
export const hiddenEnds = (
  frame: number,
  content: number,
  offset: number,
  slack: number,
): { start: boolean; end: boolean } => {
  const overflowing = frame > 0 && content > frame + 1;
  return {
    start: overflowing && offset > slack,
    end: overflowing && content - frame - offset > slack,
  };
};

/** The gradient runs from the edge inwards: opaque surface, then clear. */
const TOWARDS: Record<FadeEdge, string> = {
  left: 'to right',
  right: 'to left',
  top: 'to bottom',
  bottom: 'to top',
};

/**
 * A SOLID band at the edge, then an eased thinning. The band is what hides the
 * scroller's cut: opaque only at the very edge, a word or a chip clipped there
 * still read at 40–90 % and the clip showed as a hard line through it. Past the
 * band the content thins out instead of meeting a second edge.
 */
const STOPS = [
  { alpha: 1, at: '0%' },
  { alpha: 1, at: '35%' },
  { alpha: 0.5, at: '65%' },
  { alpha: 0, at: '100%' },
] as const;

const PLACE: Record<FadeEdge, ViewStyle> = {
  left: { top: 0, bottom: 0, left: 0, width: FADE_SIZE.row },
  right: { top: 0, bottom: 0, right: 0, width: FADE_SIZE.row },
  top: { left: 0, right: 0, top: 0, height: FADE_SIZE.area },
  bottom: { left: 0, right: 0, bottom: 0, height: FADE_SIZE.area },
};

const build = (surface: Surface, edge: FadeEdge): ViewStyle => ({
  position: 'absolute',
  ...PLACE[edge],
  // One colour throughout, only its alpha moving: no grey band in the middle
  // whichever space the platform interpolates in.
  experimental_backgroundImage: [
    {
      type: 'linear-gradient',
      direction: TOWARDS[edge],
      colorStops: STOPS.map((s) => ({
        color: tokenRgba(SURFACE_TOKEN[surface], s.alpha),
        positions: [s.at],
      })),
    },
  ],
});

/**
 * Built once per (surface, edge) and kept: the style object holds its identity
 * across renders, so a row that re-renders on every scroll event never re-sends
 * the gradient to the native side.
 */
const STYLES = new Map<string, ViewStyle>();

/** The absolute, gradient-filled style of a fade on `edge` over `surface`. */
export const fadeStyle = (surface: Surface, edge: FadeEdge): ViewStyle => {
  const key = `${surface}:${edge}`;
  const seen = STYLES.get(key);
  if (seen) return seen;
  const style = build(surface, edge);
  STYLES.set(key, style);
  return style;
};
