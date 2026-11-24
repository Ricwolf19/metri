/**
 * Whether a sheet is up, app-wide — so the screen behind it can stand back
 * from the keyboard (`useSheetOwnsKeyboard`). keyboard-controller reports a
 * keyboard opened inside a Modal to EVERY listener, and a Modal attaching or
 * detaching fires a keyboard event of its own, so a screen's keyboard-aware
 * scroll view padded and scrolled for a field it could not even see: the
 * background shifted under an open sheet and settled back when it closed.
 * Pure (no React Native), so the counting is unit-tested.
 */
let open = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

/** Counts a sheet as up until the returned release runs (twice is once). */
export const holdSheetOpen = (): (() => void) => {
  open += 1;
  emit();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    open -= 1;
    emit();
  };
};

export const subscribeSheetOpen = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const anySheetOpen = (): boolean => open > 0;

/**
 * Whether the sheet owns the keyboard now, from whether it did a moment ago.
 * It changes hands only while NO keyboard is up, either way: a keyboard the
 * screen had when a sheet opened finishes leaving under the screen's own
 * handling, and one a field in the sheet opened is gone before the screen
 * takes the keyboard back — a hand-over mid-animation scrolled the screen
 * for the sheet's field (or snapped away the screen's own keyboard room).
 */
export const sheetOwnsKeyboard = (
  owned: boolean,
  sheetOpen: boolean,
  keyboardUp: boolean,
): boolean => (keyboardUp ? owned : sheetOpen);
