/**
 * Parse a stored JSON value, falling back when it is missing or unreadable.
 *
 * MMKV values outlive app updates, so a shape written by an older build — or a
 * half-written string — must never throw. `getEventConfig` is read inside the
 * notification reconcile loop, where one bad value took every scheduled
 * reminder down with it.
 */
export const parseJson = <T>(raw: string | undefined, fallback: T): T => {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as T | null;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

/** `parseJson` for list settings: a stored value that is not an array is corrupt too. */
export const parseJsonArray = <T>(raw: string | undefined, fallback: T[]): T[] => {
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
};
