import { describe, expect, it } from 'vitest';

import { HOLD_MS, INITIAL_PULL, reducePullHold, type PullHoldEvent } from './pull-hold';

const run = (events: PullHoldEvent[]) => events.reduce(reducePullHold, INITIAL_PULL);

describe('hold at the top', () => {
  it('starts holding only when the drag begins at the top', () => {
    expect(run([{ type: 'beginDrag', atTop: false, now: 0 }]).state).toBe('idle');
    expect(run([{ type: 'beginDrag', atTop: true, now: 0 }])).toEqual({
      state: 'holding',
      heldSince: 0,
    });
  });

  it('fires once the finger has stayed down for the hold time', () => {
    const held = run([{ type: 'beginDrag', atTop: true, now: 1_000 }]);
    expect(reducePullHold(held, { type: 'tick', now: 1_000 + HOLD_MS - 1 }).state).toBe('holding');
    expect(reducePullHold(held, { type: 'tick', now: 1_000 + HOLD_MS }).state).toBe('fired');
  });

  it('cancels when the content scrolls or the finger lifts', () => {
    const held = run([{ type: 'beginDrag', atTop: true, now: 0 }]);
    expect(reducePullHold(held, { type: 'scroll', y: 30 }).state).toBe('idle');
    // An overscroll glow or a bounce still reports the top: the hold goes on.
    expect(reducePullHold(held, { type: 'scroll', y: 0 }).state).toBe('holding');
    expect(reducePullHold(held, { type: 'scroll', y: -40 }).state).toBe('holding');
    expect(reducePullHold(held, { type: 'endDrag' })).toEqual(INITIAL_PULL);
  });

  it('fires once per drag: nothing re-arms until the drag ends', () => {
    const fired = run([
      { type: 'beginDrag', atTop: true, now: 0 },
      { type: 'tick', now: HOLD_MS },
    ]);
    expect(fired.state).toBe('fired');
    expect(reducePullHold(fired, { type: 'tick', now: HOLD_MS * 2 }).state).toBe('fired');
    expect(reducePullHold(fired, { type: 'scroll', y: 50 }).state).toBe('fired');
    expect(reducePullHold(fired, { type: 'endDrag' })).toEqual(INITIAL_PULL);
  });
});
