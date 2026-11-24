/**
 * How far the finger must travel before the toast's pan takes over, either
 * way. Sideways counts too, and on purpose: once the pan is active, the press
 * under it is cancelled. Before, a sideways drag failed the pan, the press
 * survived, and its release dismissed the toast like a tap.
 */
export const PAN_SLOP = 12;

/** Release thresholds: an upward travel or an upward flick dismisses. */
export const DISMISS_DY = 36;
export const DISMISS_VY = 600;

type PanEnd = {
  translationX: number;
  translationY: number;
  velocityX: number;
  velocityY: number;
};

/**
 * Whether a released drag dismisses the toast. Only an UPWARD swipe does —
 * the heads-up banner pushed back where it came from — and only when it is
 * more up than sideways, in its travel or in its final flick (a short drag
 * flicked up counts). Anything else springs back.
 */
export const swipeDismisses = (e: PanEnd): boolean => {
  'worklet';
  const upward = e.translationY < -DISMISS_DY || e.velocityY < -DISMISS_VY;
  const mostlyUp =
    -e.translationY > Math.abs(e.translationX) || -e.velocityY > Math.abs(e.velocityX);
  return upward && mostlyUp && e.translationY < 0;
};
