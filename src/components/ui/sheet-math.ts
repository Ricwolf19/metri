/**
 * Pure geometry for `<Sheet>`: height stops and the keyboard terms. Kept out of
 * the component so the arithmetic that drives the worklet is unit-tested. The
 * keyboard helpers carry the `'worklet'` directive because `useAnimatedStyle`
 * calls them on the UI thread; under Node the directive is an inert string.
 */

export type Bounds = { min: number; max: number; stops: number[] };

/** Content-sized sheets show ALL of their content up to this share of the
 * screen, then scroll. Capping them at half hid a form's own action buttons
 * below the fold on first open (the plate calculator's Cancel / Apply). */
export const FIT_CAP = 0.92;

/** The least height the keyboard may squeeze a sheet to: the handle plus a
 * couple of rows, so a field stays reachable above a tall keyboard. */
export const MIN_LIMIT = 160;

/** A snap point as a 0.2–1 share of the window ('55%' → 0.55). */
export const pct = (stop: string): number => Math.min(1, Math.max(0.2, parseFloat(stop) / 100));

/**
 * The height stops. `snapPoints` gives them explicitly; otherwise it is the fit
 * cap alone (one stop: the sheet already hugs its content up to it).
 *
 * Taller stops are only offered once the content is known to overflow the
 * first one: the sheet sizes to its content, so on a short list dragging up
 * would stretch nothing. Gating here is what keeps the handle hint and the
 * tap-to-toggle honest.
 */
export const computeStops = (
  snapPoints: string[] | undefined,
  windowHeight: number,
  expandable: boolean,
  overflows: boolean,
  ceiling: number,
): Bounds => {
  const cap = (px: number) => Math.min(px, ceiling);
  const stops = snapPoints
    ? [...new Set(snapPoints.map((s) => cap(Math.round(windowHeight * pct(s)))))].sort(
        (a, b) => a - b,
      )
    : [cap(Math.round(windowHeight * FIT_CAP))];
  const min = stops[0];
  if (!expandable || !overflows) return { min, max: min, stops: [min] };
  return { min, max: stops[stops.length - 1], stops };
};

/**
 * The sheet's max height with the keyboard up. `kb` is keyboard-controller's
 * `height`: 0 when closed, NEGATIVE (minus the keyboard's height) while open,
 * so adding it shrinks the limit; the floor keeps a field reachable.
 */
export const keyboardLimit = (limit: number, kb: number): number => {
  'worklet';
  return Math.max(MIN_LIMIT, limit + kb);
};

/**
 * The sheet's translateY with the keyboard up: the rise/fall `offset` plus the
 * keyboard lift. The sheet pads its own `bottomInset` for the nav bar; once the
 * keyboard covers that area the padding is dead space, so `progress` (0..1)
 * cancels it as the keyboard comes up.
 */
export const keyboardLift = (
  offset: number,
  kb: number,
  bottomInset: number,
  progress: number,
): number => {
  'worklet';
  return offset + kb + bottomInset * progress;
};
