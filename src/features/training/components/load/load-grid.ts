/**
 * The arithmetic of a collapsible load grid (`LoadGrid`), pure. The grid lays
 * its pills out in REAL rows of `GRID_COLUMNS` — a wrap decides its rows by
 * the phone's width and font scale, so "a couple of rows" could not mean the
 * same thing twice, nor say which row holds the pick.
 */

/**
 * Pills per row: five of at least 44 dp (with their 7 dp gaps) fit the 280 dp
 * a 320 dp phone leaves inside a sheet.
 */
export const GRID_COLUMNS = 5;

/** Rows a folded grid holds whole; half of the rows either side peek in under the fades. */
const FOLDED_ROWS = 2;

/** The rows of the full grid a folded one opens on: `from` up to, not including, `to`. */
type GridRows = { from: number; to: number };

/**
 * The rows a folded grid opens on around `anchor` (the pick, else the load
 * nearest the row's number): the two rows of the full grid that put the anchor
 * as near their middle as they can — the anchor's own row first from its third
 * pill on, else the row before it too — so the loads either side of the pick are
 * in view. At either end of the list the rows slide in to stay full. Null when
 * the whole grid fits in what a folded one shows anyway (its rows and the peek
 * under them): there is nothing to fold.
 */
export const gridRows = (
  count: number,
  anchor: number,
  columns = GRID_COLUMNS,
  rows = FOLDED_ROWS,
): GridRows | null => {
  const total = Math.ceil(count / columns);
  if (total <= rows + 1) return null;
  const ideal = Math.round((anchor + 0.5) / columns - 1);
  const from = Math.min(Math.max(ideal, 0), total - rows);
  return { from, to: from + rows };
};

/** One row's height and the gap under it: the grid's vertical rhythm, in dp. */
type Rhythm = { rowHeight: number; gap: number };

/**
 * The folded window's height: its rows whole, the gaps between them, and half
 * a row above and below — what peeks in under the fades says the list goes on
 * (the window scrolls through every load; "Show more" lays them all out).
 */
export const windowHeight = ({ rowHeight, gap }: Rhythm, rows = FOLDED_ROWS): number =>
  (rows + 1) * (rowHeight + gap);

/**
 * Where the folded window scrolls to hold `rows` whole: half a row of the one
 * before peeking in above (none above the first row). The scroll view clamps
 * the far end itself.
 */
export const windowOffset = ({ from }: GridRows, { rowHeight, gap }: Rhythm): number =>
  Math.max(0, from * (rowHeight + gap) - rowHeight / 2 - gap);

/**
 * Whether any of `row` shows in the window scrolled to `offset`. A pick on a
 * row already in sight (a tap, a partly peeking one included) leaves the
 * window where it is, so the pill stays under the finger; only a pick made
 * elsewhere (typed, a dumbbell just added, an edited rack) brings it along.
 */
export const rowInSight = (
  row: number,
  offset: number,
  window: number,
  { rowHeight, gap }: Rhythm,
): boolean => {
  const top = row * (rowHeight + gap);
  return top + rowHeight > offset && top < offset + window;
};

/** The load closest to `value` (a number no load matches exactly), or null with nothing to match. */
export const nearestIndex = (loads: readonly number[], value: number | null): number | null => {
  if (value == null || !loads.length) return null;
  let best = 0;
  for (let i = 1; i < loads.length; i++) {
    if (Math.abs(loads[i] - value) < Math.abs(loads[best] - value)) best = i;
  }
  return best;
};
