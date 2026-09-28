/**
 * Version comparison for the "new version available" indicator. Strict
 * semver-ish: `1.11.0` vs `1.11` compares numerically per dot segment, a
 * missing segment counts as 0, and anything non-numeric (build metadata,
 * "beta" tags) never reports — a confusing prompt is worse than none.
 */

const parse = (v: string): number[] | null => {
  const trimmed = v.trim();
  if (!/^\d+(\.\d+)*$/.test(trimmed)) return null;
  return trimmed.split('.').map(Number);
};

/** True when `latest` is a strictly newer, well-formed version than `installed`. */
export const isNewerVersion = (installed: string, latest: string): boolean => {
  const a = parse(installed);
  const b = parse(latest);
  if (!a || !b) return false;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (y > x) return true;
    if (y < x) return false;
  }
  return false;
};
