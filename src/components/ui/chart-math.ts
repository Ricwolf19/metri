/**
 * The numbers behind `TrendChart` and `BarChart`, kept pure so they are
 * tested without a canvas: the padded domains, which point a finger is
 * nearest, and which bar labels fit under a narrow chart.
 */

/** `[lo, hi]` of `values`, padded by `pad` of the span on both sides. A flat
 * series (or a single value) still gets a span, so it sits mid-plot instead of
 * dividing by zero. */
export const paddedDomain = (values: readonly number[], pad = 0.08): [number, number] => {
  if (!values.length) return [0, 1];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || Math.max(1, Math.abs(hi) * 0.02);
  return [lo - span * pad, hi + span * pad];
};

/** `[min, max]` of x positions; a single position is centred in a span of 2. */
export const xDomain = (xs: readonly number[]): [number, number] => {
  if (!xs.length) return [0, 1];
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  return hi === lo ? [lo - 1, hi + 1] : [lo, hi];
};

/** Index of the position nearest `target` (pixels); -1 when there are none. */
export const nearestIndex = (positions: readonly number[], target: number): number => {
  let best = -1;
  let bestDistance = Infinity;
  positions.forEach((p, i) => {
    const d = Math.abs(p - target);
    if (d < bestDistance) {
      best = i;
      bestDistance = d;
    }
  });
  return best;
};

/**
 * Every how many bars a label is printed, so labels at least `minLabelWidth`
 * wide never overlap across `width`. 1 = every bar.
 */
export const labelStride = (count: number, width: number, minLabelWidth: number): number => {
  if (count <= 0 || width <= 0) return 1;
  return Math.max(1, Math.ceil((count * minLabelWidth) / width));
};

/** Whether bar `index` prints its label: counted back from the LAST bar,
 * which always does (it is the current one). */
export const showsLabel = (index: number, count: number, stride: number): boolean =>
  (count - 1 - index) % stride === 0;

/** First, last, lowest and highest of a series, for its spoken summary. */
export const seriesExtent = (
  ys: readonly number[],
): { first: number; last: number; min: number; max: number } | null =>
  ys.length
    ? { first: ys[0], last: ys[ys.length - 1], min: Math.min(...ys), max: Math.max(...ys) }
    : null;

/** Top, middle and bottom values of a (niced) y domain, in that order. */
export const axisValues = (domain: readonly number[]): [number, number, number] => {
  const hi = Math.max(...domain);
  const lo = Math.min(...domain);
  return [hi, (hi + lo) / 2, lo];
};
