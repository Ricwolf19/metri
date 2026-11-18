import type { MediaAlign } from '@/db/schema';

/**
 * How a photo sits in a frame (`MediaAlign`): drawn to COVER the frame at
 * `scale` 1, zoomed up to `MAX_SCALE`, its centre moved by `x`/`y` (fractions
 * of the frame's width/height). Every transform is clamped so the photo always
 * covers the frame — a comparison never shows a gap at an edge. Pure, so the
 * compare screen, the share card and a test read one geometry.
 */

export type Size = { width: number; height: number };
/** A photo's stored pixel size; older rows have none. */
export type ImageSize = { width?: number | null; height?: number | null };

export const IDENTITY: MediaAlign = { scale: 1, x: 0, y: 0 };
const MIN_SCALE = 1;
const MAX_SCALE = 3;

/** A photo with no recorded size is taken as the capture frame's 3:4. */
const DEFAULT_IMAGE: Size = { width: 3, height: 4 };

/** `|| 0` folds a negative zero, so a centred photo stores 0, not -0. */
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n)) || 0;

const known = (image: ImageSize | null | undefined): Size =>
  image?.width && image.height ? { width: image.width, height: image.height } : DEFAULT_IMAGE;

/** The photo's drawn size inside `frame` at `scale` (cover, aspect kept). */
export const coverSize = (
  frame: Size,
  image: ImageSize | null | undefined,
  scale: number,
): Size => {
  const img = known(image);
  const cover = Math.max(frame.width / img.width, frame.height / img.height) * scale;
  return { width: img.width * cover, height: img.height * cover };
};

/** Bring a transform back inside its limits: scale 1–3, no edge of the frame left uncovered. */
export const clampAlign = (
  align: MediaAlign,
  frame: Size,
  image: ImageSize | null | undefined,
): MediaAlign => {
  const scale = clamp(Number.isFinite(align.scale) ? align.scale : 1, MIN_SCALE, MAX_SCALE);
  if (frame.width <= 0 || frame.height <= 0) return { scale, x: 0, y: 0 };
  const drawn = coverSize(frame, image, scale);
  const maxX = (drawn.width - frame.width) / 2 / frame.width;
  const maxY = (drawn.height - frame.height) / 2 / frame.height;
  return {
    scale,
    x: clamp(Number.isFinite(align.x) ? align.x : 0, -maxX, maxX),
    y: clamp(Number.isFinite(align.y) ? align.y : 0, -maxY, maxY),
  };
};

/**
 * A pinch + pan in progress, from the transform it started on: the pinch
 * multiplies the scale, the pan (in px) moves the centre.
 */
export const applyGesture = (
  start: MediaAlign,
  gesture: { scale: number; dx: number; dy: number },
  frame: Size,
  image: ImageSize | null | undefined,
): MediaAlign =>
  clampAlign(
    {
      scale: start.scale * gesture.scale,
      x: start.x + (frame.width > 0 ? gesture.dx / frame.width : 0),
      y: start.y + (frame.height > 0 ? gesture.dy / frame.height : 0),
    },
    frame,
    image,
  );

/** Where to draw the photo, in the frame's own coordinates. */
export const placement = (
  align: MediaAlign | null | undefined,
  frame: Size,
  image: ImageSize | null | undefined,
): { left: number; top: number; width: number; height: number } => {
  const a = clampAlign(align ?? IDENTITY, frame, image);
  const drawn = coverSize(frame, image, a.scale);
  return {
    left: (frame.width - drawn.width) / 2 + a.x * frame.width,
    top: (frame.height - drawn.height) / 2 + a.y * frame.height,
    width: drawn.width,
    height: drawn.height,
  };
};

/** True when there is nothing worth saving (a reset, or a gesture that came back home). */
export const isIdentity = (align: MediaAlign | null | undefined): boolean =>
  !align ||
  (Math.abs(align.scale - 1) < 0.005 && Math.abs(align.x) < 0.002 && Math.abs(align.y) < 0.002);
