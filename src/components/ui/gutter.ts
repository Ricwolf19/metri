/**
 * The side padding of the boxes a strip bleeds through, in dp: a `ScrollRow`
 * (or a `BadgeRow` / `ChipRow` / `ChoiceCarousel`) that spans one of these
 * boxes passes the box's padding as `bleed`, so its content scrolls out to the
 * box's real edge and the fades sit there. Clipped at the padding line, a
 * strip stopped short of the surface's edge and its fade left a band of bare
 * background beyond it. NativeWind's rem is 14 dp here, so a spacing step is
 * 3.5 dp: `px-5` is 17.5, not Tailwind's 20 (`tailwind-config.test.ts`
 * checks each one against the class it names).
 */

/** `px-5`: a screen's content, and a sheet body that pads itself the same way. */
export const SCREEN_GUTTER = 17.5;

/** `p-5`: a `Card`'s own padding. Its 1 dp border stays outside the bleed. */
export const CARD_GUTTER = 17.5;

/** `p-4` / `px-4`: the tighter boxes — a check-in card, the rest timer, the camera's pose bar. */
export const TIGHT_GUTTER = 14;

/** The side padding `ScrollArea inSheet` (and so `SheetForm`) gives a sheet's body. */
export const SHEET_GUTTER = 20;

/** The room under the last row of a sheet's scroll body (`ScrollArea inSheet`, `ExerciseList inSheet`). */
export const SHEET_END = 20;
