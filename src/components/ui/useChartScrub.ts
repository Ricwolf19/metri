import { useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';

import { nearestIndex, seriesKey } from './chart-math';

type Scale = (value: number) => number;

const samePositions = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * Touch-to-read for a chart drawn by `CartesianChart`: a tap picks the point
 * (or bar) nearest the finger and a second tap on it lets go, a SIDEWAYS drag
 * scrubs along the series. A vertical drag fails the pan, so a chart inside a
 * scrolling screen never traps the scroll. The pick lives in JS state and
 * changes only when the nearest index does — a handful of renders per drag,
 * never one per frame. The selection survives the finger lifting; it resets
 * when the series changes (another window, another measure, new values on
 * the same bars).
 *
 * `xs`/`ys` are the series as drawn. The chart hands its x scale over through
 * `onScaleChange` (only known once the canvas has measured itself); the
 * points' pixel positions are kept as state, and only a CHANGE is stored —
 * the chart calls back on every render, so storing each call would loop.
 */
export const useChartScrub = (xs: readonly number[], ys: readonly number[]) => {
  const [positions, setPositions] = useState<readonly number[]>([]);
  // The pick is kept per series (`seriesKey`): new data drops it without an effect.
  const shape = seriesKey(xs, ys);
  const [pick, setPick] = useState<{ shape: string; index: number } | null>(null);

  const scrubTo = (px: number) => {
    const index = nearestIndex(positions, px);
    if (index < 0) return;
    setPick((prev) => (prev?.shape === shape && prev.index === index ? prev : { shape, index }));
  };
  const toggleAt = (px: number) => {
    const index = nearestIndex(positions, px);
    if (index < 0) return;
    setPick((prev) => (prev?.shape === shape && prev.index === index ? null : { shape, index }));
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-8, 8])
    .failOffsetY([-10, 10])
    .onStart((e) => scrubTo(e.x))
    .onUpdate((e) => scrubTo(e.x));
  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e, success) => {
      if (success) toggleAt(e.x);
    });

  return {
    /** The picked index, or null (the chart then reads its latest point). */
    selected: pick?.shape === shape && pick.index < xs.length ? pick.index : null,
    gesture: Gesture.Race(pan, tap),
    onScale: (toPx: Scale) => {
      const next = xs.map(toPx);
      setPositions((prev) => (samePositions(prev, next) ? prev : next));
    },
  };
};
