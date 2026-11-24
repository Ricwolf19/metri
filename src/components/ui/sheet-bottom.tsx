import { createContext, useContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

/**
 * What a `<Sheet>` tells its body about the bottom: the safe-area padding it
 * keeps under the body (the navigation bar, the home indicator) and how much of
 * that padding the keyboard covers right now (`keyboardCover`, UI thread).
 *
 * The body that is the sheet's LAST child runs through that padding to the
 * physical edge (`ScrollArea inSheet`, `ExerciseList inSheet`): it pulls its
 * bottom down by `inset` and adds `inset` to the end of its content, so the
 * last row still scrolls clear of the bar while the rest passes under it and
 * fades at the edge. Stopping at the padding left an inset-high band of empty
 * sheet under every list's fade.
 */
type SheetBottom = { inset: number; covered: SharedValue<number> };

const SheetBottomContext = createContext<SheetBottom | null>(null);

/** The enclosing sheet's bottom; null outside a sheet. */
const useSheetBottom = (): SheetBottom | null => useContext(SheetBottomContext);

/**
 * How far a sheet's scroll body runs through the sheet's bottom safe area — the
 * ONE rule `ScrollArea inSheet`, `ExerciseList inSheet` and `SheetForm` share:
 * the inset when `on` (it is the sheet's last child) and inside a sheet, else 0;
 * with `covered`, how much of it the keyboard hides right now.
 */
export const useSheetBleed = (on: boolean): { inset: number; covered?: SharedValue<number> } => {
  const sheet = useSheetBottom();
  return on && sheet ? { inset: sheet.inset, covered: sheet.covered } : { inset: 0 };
};

export const SheetBottomProvider = ({
  value,
  children,
}: {
  value: SheetBottom;
  children: React.ReactNode;
}) => <SheetBottomContext value={value}>{children}</SheetBottomContext>;
