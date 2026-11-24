import { describe, expect, it } from 'vitest';

import {
  FIELD_LEAD,
  KEYBOARD_CLEARANCE,
  fieldRevealOffset,
  liftedFooterHeight,
} from './keyboard-room';

describe('liftedFooterHeight', () => {
  it('is nothing until the footer has been measured', () => {
    expect(liftedFooterHeight(0, 34, false)).toBe(0);
  });

  it('tucks the safe-area padding behind the keyboard when the footer carries it', () => {
    expect(liftedFooterHeight(110, 34, false)).toBe(76);
  });

  it('keeps the whole footer when the screen pads its own bottom edge', () => {
    expect(liftedFooterHeight(76, 34, true)).toBe(76);
  });
});

describe('fieldRevealOffset', () => {
  const H = 48;

  it('leaves a form that fits above the keyboard where it is', () => {
    expect(
      fieldRevealOffset({ top: 100, height: H, content: 300, viewport: 320, offset: 0 }),
    ).toBeNull();
  });

  it('leaves a field the lifter tapped in view where it is', () => {
    // Scrolled to the end of the rack editor, a field mid-sheet: nothing moves.
    expect(
      fieldRevealOffset({ top: 560, height: H, content: 900, viewport: 400, offset: 500 }),
    ).toBeNull();
  });

  it('brings a field the keyboard covers up just far enough for what follows it', () => {
    // The quick-add's last row on a small phone: field, hint and the Add come into view.
    const y = fieldRevealOffset({ top: 250, height: H, content: 600, viewport: 280, offset: 0 });
    expect(y).toBe(250 + H + KEYBOARD_CLEARANCE - 280);
  });

  it('nudges a visible field whose hint and next row sit under the keyboard', () => {
    // In view, but its clearance is not: a small move, not a jump to the top.
    expect(fieldRevealOffset({ top: 150, height: H, content: 600, viewport: 280, offset: 0 })).toBe(
      150 + H + KEYBOARD_CLEARANCE - 280,
    );
  });

  it('never scrolls the label out at the top, however little room is left', () => {
    expect(
      fieldRevealOffset({ top: 90, height: 260, content: 800, viewport: 280, offset: 0 }),
    ).toBe(90 - FIELD_LEAD);
  });

  it('asks for no room past the end of the form', () => {
    // The last field: its clearance would run off the end, so the end is the target.
    expect(fieldRevealOffset({ top: 480, height: H, content: 560, viewport: 280, offset: 0 })).toBe(
      560 - 280,
    );
  });

  it('brings a field scrolled past back down to its label', () => {
    expect(
      fieldRevealOffset({ top: 40, height: H, content: 600, viewport: 280, offset: 200 }),
    ).toBe(8);
  });

  it('stays put when it is already there', () => {
    expect(
      fieldRevealOffset({ top: 250, height: H, content: 600, viewport: 280, offset: 122 }),
    ).toBeNull();
  });
});
