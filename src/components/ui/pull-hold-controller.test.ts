import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native-reanimated', () => ({
  // The controller only ever assigns the timing's target; the stub makes that target readable.
  withTiming: (to: number) => to,
  Easing: { linear: 'linear' },
}));

const { makePullHoldController } = await import('./pull-hold-controller');
const { HOLD_DEBOUNCE_MS, HOLD_MS } = await import('./pull-hold');

const event = (y: number) => ({ nativeEvent: { contentOffset: { y } } }) as never;

const setup = () => {
  const progress = { value: 0 };
  const forward = vi.fn();
  const fire = vi.fn();
  const c = makePullHoldController(progress as never, forward);
  return { c, progress, forward, fire };
};

describe('pull-hold controller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is inert until configured, and always forwards the scroll event', () => {
    const { c, forward, fire, progress } = setup();
    c.onScrollBeginDrag(event(0));
    c.onScroll(event(0));
    vi.advanceTimersByTime(HOLD_MS + 50);

    expect(fire).not.toHaveBeenCalled();
    expect(progress.value).toBe(0);
    expect(forward).toHaveBeenCalledTimes(1);
  });

  it('fires once after the hold, with the bar starting only after the debounce', () => {
    const { c, fire, progress } = setup();
    c.configure(fire);

    c.onScrollBeginDrag(event(0));
    vi.advanceTimersByTime(HOLD_DEBOUNCE_MS - 1);
    expect(progress.value).toBe(0);
    vi.advanceTimersByTime(1);
    expect(progress.value).toBe(1);

    vi.advanceTimersByTime(HOLD_MS - HOLD_DEBOUNCE_MS - 1);
    expect(fire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fire).toHaveBeenCalledTimes(1);

    // Still down: no second spotlight until the finger lifts.
    vi.advanceTimersByTime(HOLD_MS);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it('lifting the finger cancels the hold and drops the bar', () => {
    const { c, fire, progress } = setup();
    c.configure(fire);

    c.onScrollBeginDrag(event(0));
    vi.advanceTimersByTime(HOLD_DEBOUNCE_MS + 10);
    expect(progress.value).toBe(1);
    c.onScrollEndDrag();
    vi.advanceTimersByTime(HOLD_MS);

    expect(progress.value).toBe(0);
    expect(fire).not.toHaveBeenCalled();
  });

  it('scrolling the content away from the top cancels; a drag that starts lower never arms', () => {
    const { c, fire, progress } = setup();
    c.configure(fire);

    c.onScrollBeginDrag(event(0));
    c.onScroll(event(40));
    vi.advanceTimersByTime(HOLD_MS);
    expect(fire).not.toHaveBeenCalled();
    expect(progress.value).toBe(0);

    c.onScrollEndDrag();
    c.onScrollBeginDrag(event(120));
    vi.advanceTimersByTime(HOLD_MS);
    expect(fire).not.toHaveBeenCalled();
  });

  it('a quick scroll from the top never shows the bar', () => {
    const { c, fire, progress } = setup();
    c.configure(fire);

    c.onScrollBeginDrag(event(0));
    vi.advanceTimersByTime(HOLD_DEBOUNCE_MS - 50);
    c.onScroll(event(8));
    c.onScrollEndDrag();
    vi.advanceTimersByTime(HOLD_MS);

    expect(progress.value).toBe(0);
    expect(fire).not.toHaveBeenCalled();
  });

  it('configure(undefined) switches a live controller off', () => {
    const { c, fire } = setup();
    c.configure(fire);
    c.configure(undefined);

    c.onScrollBeginDrag(event(0));
    vi.advanceTimersByTime(HOLD_MS);
    expect(fire).not.toHaveBeenCalled();
  });
});
