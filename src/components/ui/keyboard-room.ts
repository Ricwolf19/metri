/**
 * Keyboard geometry shared by `Screen` and `SheetForm`: what stays visible
 * under a focused field, the height a sticky footer shows above the keyboard,
 * and where a sheet's form scrolls to reveal its field. Pure, so the arithmetic
 * is unit-tested (`keyboard-room.test.ts`).
 */

/**
 * Kept visible under a focused field: its hint line, the gap, and the next
 * field's label and box — which also covers a Save or a Cancel / Save row.
 * keyboard-controller measures from the caret line, which on a one-line field
 * is its bottom edge; at 24 every action under a field sat behind the keyboard
 * (the exercise note's Save, the check-in's next site).
 */
export const KEYBOARD_CLEARANCE = 104;

/**
 * The height a screen's sticky footer shows above the keyboard. It rides the
 * keyboard with its safe-area padding tucked behind it: on a screen that does
 * not pad its own bottom edge, that padding is part of the measured footer.
 */
export const liftedFooterHeight = (
  measured: number,
  bottomInset: number,
  screenPadsBottom: boolean,
): number => (measured > 0 ? Math.max(0, measured - (screenPadsBottom ? 0 : bottomInset)) : 0);

/** Room kept above a revealed field for its label. */
export const FIELD_LEAD = 32;

type Reveal = {
  /** The focused field's top, in the form's content coordinates. */
  top: number;
  /** The focused field's own height (a multiline note is taller). */
  height: number;
  /** The scroll view's whole content height, its padding included. */
  content: number;
  /** The scroll view's height, the keyboard already up. */
  viewport: number;
  /** The scroll offset now. */
  offset: number;
};

/**
 * Where a sheet's form scrolls once the keyboard has settled, or `null` to
 * stay. A field already in view with its clearance under it (its hint, then
 * the next field or the Save: `KEYBOARD_CLEARANCE`) never moves the form:
 * pulling every focused field up to the top shoved the form around on each
 * tap, the field the lifter was looking at with it. A field the keyboard
 * covers comes up only as far as that clearance needs, never so far that its
 * label leaves the top; one scrolled past above comes back down to its label.
 */
export const fieldRevealOffset = ({
  top,
  height,
  content,
  viewport,
  offset,
}: Reveal): number | null => {
  const furthest = Math.max(0, content - viewport);
  const labelTop = top - FIELD_LEAD;
  // Nothing exists past the end of the form to make room for.
  const wanted = Math.min(top + height + KEYBOARD_CLEARANCE, content);
  if (labelTop >= offset && wanted <= offset + viewport) return null;
  const target = labelTop < offset ? labelTop : Math.min(labelTop, wanted - viewport);
  const clamped = Math.min(Math.max(0, target), furthest);
  return Math.abs(clamped - offset) < 1 ? null : clamped;
};
