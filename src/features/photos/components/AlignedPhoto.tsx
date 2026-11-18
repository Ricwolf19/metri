import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import type { MediaAlign } from '@/db/schema';

import { applyGesture, IDENTITY, isIdentity, placement } from '../align';

/** Strong enough that a face is gone, not just soft. */
const FACE_BLUR = 48;

/** A transform mid-gesture, with the last raw pinch scale and pan translation it came from. */
type Live = { align: MediaAlign; scale: number; x: number; y: number };

type Props = {
  /** Already resolved (`mediaUri`). */
  uri: string;
  image: { width: number | null; height: number | null };
  align: MediaAlign | null;
  /** The frame's width in dp; its height follows `aspect`. */
  width: number;
  /** Width / height, the capture frame's 3:4 by default. */
  aspect?: number;
  /** Pinch to zoom and drag to move; `onAlignEnd` hears the result when the fingers lift. */
  editable?: boolean;
  onAlignEnd?: (align: MediaAlign | null) => void;
  /** Blur this fraction of the frame from the top (a face), lined up with the photo under it. */
  blurTop?: number | null;
  /** Stacking a second photo over a first (the comparison's fade). */
  opacity?: number;
  className?: string;
};

/**
 * A progress photo in a fixed frame, drawn the way `align.ts` places it:
 * covering the frame, zoomed and moved by the photo's saved `MediaAlign`. The
 * compare screen edits that transform in place (pinch + pan, clamped so no
 * edge ever shows); the share card draws the same geometry, so a photo lined
 * up once sits the same everywhere. The face blur is a second, blurred copy of
 * the photo clipped to a band at the top — native image views, so a view-shot
 * capture keeps it.
 */
export const AlignedPhoto = ({
  uri,
  image,
  align,
  width,
  aspect = 3 / 4,
  editable = false,
  onAlignEnd,
  blurTop = null,
  opacity = 1,
  className = '',
}: Props) => {
  const frame = { width, height: width / aspect };
  // The transform while the fingers are down (null = the saved one), with the
  // last raw pinch scale and pan translation, so each update applies only its
  // own increment and a pinch and a pan can overlap. A saved value that
  // changes to something ELSE (a reset) or the edit ending drops it, so the
  // frame always settles on what is stored. JS state, read by the
  // gesture callbacks of the latest render (as `useChartScrub` does).
  const [live, setLive] = useState<Live | null>(null);
  const savedKey = `${editable}|${align ? `${align.scale}:${align.x}:${align.y}` : ''}`;
  const [seenKey, setSeenKey] = useState(savedKey);
  if (seenKey !== savedKey) {
    setSeenKey(savedKey);
    // Its own save landing (a pinch ending while the pan goes on) keeps the gesture.
    const own =
      editable &&
      live !== null &&
      align !== null &&
      live.align.scale === align.scale &&
      live.align.x === align.x &&
      live.align.y === align.y;
    if (!own) setLive(null);
  }
  const shown = live?.align ?? align ?? IDENTITY;

  const start = (reset: Partial<Omit<Live, 'align'>>) =>
    setLive((prev) => ({ align: prev?.align ?? shown, scale: 1, x: 0, y: 0, ...prev, ...reset }));
  const move = (next: { scale?: number; x?: number; y?: number }) =>
    setLive((prev) => {
      const base = prev ?? { align: shown, scale: 1, x: 0, y: 0 };
      const scale = next.scale ?? base.scale;
      const x = next.x ?? base.x;
      const y = next.y ?? base.y;
      const step = { scale: scale / (base.scale || 1), dx: x - base.x, dy: y - base.y };
      return { align: applyGesture(base.align, step, frame, image), scale, x, y };
    });
  const commit = () => {
    if (live) onAlignEnd?.(isIdentity(live.align) ? null : live.align);
  };

  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .enabled(editable)
    .onBegin(() => start({ scale: 1 }))
    .onUpdate((e) => move({ scale: e.scale }))
    .onEnd(commit);
  const pan = Gesture.Pan()
    .runOnJS(true)
    .enabled(editable)
    .onBegin(() => start({ x: 0, y: 0 }))
    .onUpdate((e) => move({ x: e.translationX, y: e.translationY }))
    .onEnd(commit);

  const at = placement(shown, frame, image);
  const photoStyle = {
    position: 'absolute' as const,
    left: at.left,
    top: at.top,
    width: at.width,
    height: at.height,
  };
  const band = blurTop ? Math.min(1, Math.max(0, blurTop)) * frame.height : 0;

  const body = (
    <View
      className={`overflow-hidden bg-ink-800 ${className}`}
      style={{ width: frame.width, height: frame.height, opacity }}
    >
      <Image source={{ uri }} style={photoStyle} contentFit="cover" transition={120} />
      {band > 0 ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, top: 0, width: frame.width, height: band }}
          className="overflow-hidden"
        >
          <Image source={{ uri }} style={photoStyle} contentFit="cover" blurRadius={FACE_BLUR} />
        </View>
      ) : null}
    </View>
  );

  return editable ? (
    <GestureDetector gesture={Gesture.Simultaneous(pinch, pan)}>{body}</GestureDetector>
  ) : (
    body
  );
};
