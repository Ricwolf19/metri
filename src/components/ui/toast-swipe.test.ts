import { describe, expect, it } from 'vitest';

import { DISMISS_DY, DISMISS_VY, swipeDismisses } from './toast-swipe';

const drag = (translationX: number, translationY: number, velocityX = 0, velocityY = 0) => ({
  translationX,
  translationY,
  velocityX,
  velocityY,
});

describe('swipeDismisses', () => {
  it('dismisses an upward swipe past the distance', () => {
    expect(swipeDismisses(drag(0, -DISMISS_DY - 1))).toBe(true);
  });

  it('dismisses a short upward flick', () => {
    expect(swipeDismisses(drag(4, -14, 50, -DISMISS_VY - 100))).toBe(true);
  });

  it('springs back from a short upward drag', () => {
    expect(swipeDismisses(drag(0, -DISMISS_DY + 4))).toBe(false);
  });

  it('never dismisses a sideways swipe, slow or fast', () => {
    expect(swipeDismisses(drag(220, -10))).toBe(false);
    expect(swipeDismisses(drag(-220, -6, -1800, -40))).toBe(false);
  });

  it('never dismisses a sideways swipe that drifts up past the distance', () => {
    expect(swipeDismisses(drag(260, -DISMISS_DY - 10, 1500, -300))).toBe(false);
  });

  it('never dismisses a downward drag', () => {
    expect(swipeDismisses(drag(0, 80, 0, 900))).toBe(false);
  });
});
