/**
 * The rows an exercise card draws, and which one is live. Pure: the card and
 * the drafts store (`liveAfterDelete`) read the same rule, so a draft is never
 * written for a row nobody renders.
 */

export type SetRow<T> = { i: number; logged: T | null };

/**
 * Planned ordinals with the logged sets poured into the non-skipped ones in
 * order: a skipped row keeps its number, the sets after it shift nothing.
 */
const rowModel = <T>(
  total: number,
  skipped: ReadonlySet<number>,
  working: readonly T[],
): SetRow<T>[] => {
  let w = 0;
  return Array.from({ length: total }, (_, i) => {
    if (skipped.has(i) || w >= working.length) return { i, logged: null };
    const logged = working[w];
    w += 1;
    return { i, logged };
  });
};

/**
 * The card's rows and its live one. The card draws the plan, or more once
 * sets ran past it, plus the extra rows the lifter opened. The live row is
 * the FIRST ordinal neither skipped nor logged — never a count of settled
 * rows: deleting a set that came before a skipped one left the count pointing
 * at the skipped row, so nothing was live and the card was stuck. Null once
 * every row is settled.
 */
export const setRows = <T>(input: {
  planned: number;
  skipped: ReadonlySet<number>;
  /** Working (non-warm-up) sets logged this session, in order. */
  working: readonly T[];
  extra: number;
}): { model: SetRow<T>[]; live: number | null } => {
  const { planned, skipped, working, extra } = input;
  const total = Math.max(planned, working.length + skipped.size) + extra;
  const model = rowModel(total, skipped, working);
  const live = model.find((r) => r.logged === null && !skipped.has(r.i))?.i ?? null;
  return { model, live };
};
