/**
 * The value one step away on a wheel (a screen reader's increment/decrement),
 * clamped at both ends: a wheel never wraps, the way a finger cannot drag it
 * past its first or last row. A value missing from the list starts from the
 * first row, the one the wheel shows for it.
 */
export const wheelStep = (values: readonly number[], value: number, dir: 1 | -1): number => {
  if (!values.length) return value;
  const at = Math.max(0, values.indexOf(value));
  return values[Math.min(values.length - 1, Math.max(0, at + dir))];
};
