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
 * How far the fade reaches in from its edge. A row's reads past the 17.5–20 dp
 * gutter a bleeding strip runs through (`gutter.ts`) and still never hides a
 * short chip outright; an area's covers the glyphs a 44 dp row cuts at the
 * clip, and over a sheet's bottom safe area it reaches past a gesture bar.
 */
export const FADE_SIZE = { row: 32, area: 36 } as const;

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
 * The fade's opacity a share `t` of its depth in from the edge: one minus a
 * smoothstep, flat at both ends. Near-opaque against the edge (above 0.9
 * through the first 15 %), which hides the scroller's cut where nothing bleeds
 * past it — opaque only at the very edge, a word clipped there still read at
 * 40–90 % and the clip showed as a hard line through it. Then it eases out and
 * lands on clear with no line where it stops. The solid band it replaces ended
 * in a kink the eye read as a second edge.
 */
const ease = (t: number): number => 1 - t * t * (3 - 2 * t);

/** Eighths: enough stops that the straight runs between them read as the curve. */
const STOP_COUNT = 9;

const STOPS = Array.from({ length: STOP_COUNT }, (_, i) => {
  const t = i / (STOP_COUNT - 1);
  return { alpha: Math.round(ease(t) * 1000) / 1000, at: `${t * 100}%` };
});

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
