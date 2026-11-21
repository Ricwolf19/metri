import { describe, expect, it } from 'vitest';

import { FIELD_LEAD, fieldRevealOffset, liftedFooterHeight } from './keyboard-room';

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
  it('leaves a form that fits above the keyboard where it is', () => {
    expect(fieldRevealOffset({ top: 200, content: 300, viewport: 320, offset: 0 })).toBeNull();
  });

  it('scrolls a field below the fold up to the top, label included', () => {
    // The quick-add's last row on a small phone: the Add under it comes into view.
    expect(fieldRevealOffset({ top: 250, content: 410, viewport: 280, offset: 0 })).toBe(130);
  });

  it('never scrolls the field itself out at the top', () => {
    expect(fieldRevealOffset({ top: 90, content: 600, viewport: 280, offset: 0 })).toBe(
      90 - FIELD_LEAD,
    );
  });

  it('brings a field scrolled past back into view', () => {
    expect(fieldRevealOffset({ top: 40, content: 600, viewport: 280, offset: 200 })).toBe(8);
  });

  it('stays put when it is already there', () => {
    expect(fieldRevealOffset({ top: 250, content: 410, viewport: 280, offset: 130 })).toBeNull();
  });
});
