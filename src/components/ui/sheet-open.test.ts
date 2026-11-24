import { describe, expect, it } from 'vitest';

import { anySheetOpen, holdSheetOpen, sheetOwnsKeyboard, subscribeSheetOpen } from './sheet-open';

describe('holdSheetOpen', () => {
  it('counts every sheet up until each lets go, a second release changing nothing', () => {
    const seen: boolean[] = [];
    const stop = subscribeSheetOpen(() => seen.push(anySheetOpen()));
    const first = holdSheetOpen();
    const second = holdSheetOpen();
    first();
    first();
    expect(anySheetOpen()).toBe(true);
    second();
    expect(anySheetOpen()).toBe(false);
    stop();
    expect(seen).toEqual([true, true, true, false]);
  });
});

describe('sheetOwnsKeyboard', () => {
  it('takes the keyboard as a sheet opens with none up, and hands it back as it closes', () => {
    expect(sheetOwnsKeyboard(false, true, false)).toBe(true);
    expect(sheetOwnsKeyboard(true, false, false)).toBe(false);
  });

  it('lets the screen’s own keyboard leave under the screen before taking over', () => {
    // A sheet opened while the screen's field had the keyboard up.
    expect(sheetOwnsKeyboard(false, true, true)).toBe(false);
  });

  it('keeps the keyboard a field in the sheet opened, even once the sheet is gone', () => {
    expect(sheetOwnsKeyboard(true, true, true)).toBe(true);
    // Closing with that keyboard still up: it leaves before the screen takes over.
    expect(sheetOwnsKeyboard(true, false, true)).toBe(true);
  });
});
