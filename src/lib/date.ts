/** Date helpers shared across features (timestamps are stored as epoch-ms Dates). */

/** Local `yyyy-mm-dd` for a date — stable key/label, not affected by timezone shifts. */
export const formatYmd = (d: Date): string => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Local `yyyy-mm` for a date. */
export const formatYearMonth = (d: Date): string => formatYmd(d).slice(0, 7);
