import { createContext, useContext } from 'react';

import type { Surface } from './edge-fade';

/** Nothing declared means the screen itself: every screen and sheet is ink-900. */
const SurfaceContext = createContext<Surface>('base');

/** The fill under this point of the tree, as the nearest painter declared it. */
export const useSurface = (): Surface => useContext(SurfaceContext);

/**
 * Declares the fill its children sit on. `Card` and `Sheet` wrap their own
 * content in it; a one-off box that paints a fill of its own (an inset
 * `bg-ink-850` row, a `bg-ink-800` panel) wraps its content too, so the edge
 * fades of the strips inside melt into that box rather than the screen.
 */
export const OnSurface = ({
  surface,
  children,
}: {
  surface: Surface;
  children: React.ReactNode;
}) => <SurfaceContext value={surface}>{children}</SurfaceContext>;
