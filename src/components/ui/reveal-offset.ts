/** Room left above a revealed option so the one before it still peeks in —
 * the lifter sees the list continues upward instead of starting mid-air. */
const LEAD = 56;

/** Scroll offset that brings an option at content `y` into view near the top. */
export const revealOffset = (y: number): number => Math.max(0, y - LEAD);
