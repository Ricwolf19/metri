/**
 * The "hold at the top" gesture that opens the spotlight (the Obsidian mobile
 * rule: drag down at the very top and keep the finger there), as a pure state
 * machine so the timing is testable without a scroll view:
 *
 *   idle ──drag begins at the top──▶ holding ──HOLD_MS──▶ fired
 *
 * Fed by the scroll view's own drag events (@see AGENTS.md "Spotlight" for why
 * never a gesture handler). Scrolling away from the top or letting go cancels;
 * `fired` stays until the drag ends, so one hold opens one spotlight. Android
 * reports no negative offset (no bounce), so "at the top" is `y <= 0` when the
 * drag starts.
 */
type PullHoldState = 'idle' | 'holding' | 'fired';

export type PullHold = { state: PullHoldState; heldSince: number | null };

export type PullHoldEvent =
  | { type: 'beginDrag'; atTop: boolean; now: number }
  | { type: 'scroll'; y: number }
  | { type: 'tick'; now: number }
  | { type: 'endDrag' };

/** How long the finger must stay down at the top before the spotlight opens. */
export const HOLD_MS = 1000;
/** A touch shorter than this is a scroll that started at the top, not a hold: the bar waits it out. */
export const HOLD_DEBOUNCE_MS = 250;

export const INITIAL_PULL: PullHold = { state: 'idle', heldSince: null };

export const reducePullHold = (s: PullHold, e: PullHoldEvent): PullHold => {
  switch (e.type) {
    case 'beginDrag':
      return e.atTop ? { state: 'holding', heldSince: e.now } : INITIAL_PULL;
    case 'scroll':
      // Moving the content means the finger is scrolling, not holding.
      return e.y > 0 && s.state === 'holding' ? INITIAL_PULL : s;
    case 'tick':
      return s.state === 'holding' && s.heldSince != null && e.now - s.heldSince >= HOLD_MS
        ? { state: 'fired', heldSince: null }
        : s;
    case 'endDrag':
      return INITIAL_PULL;
  }
};
