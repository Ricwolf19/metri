/** Compact kg: four digits become `12.4k` so a stat never outgrows its column. */
export const fmtVol = (v: number): string => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`);
