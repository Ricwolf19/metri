/** Seconds → "m:ss" (rest times, short countdowns). */
export const mmss = (total: number): string => {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${`${s}`.padStart(2, '0')}`;
};
