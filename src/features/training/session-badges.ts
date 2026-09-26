/**
 * Session badges as they can appear in a stored `plannedSnapshot`. Snapshots
 * written before the badges key existed deserialize with `badges: undefined`,
 * and a `.length` read on that row broke the card list — the badges (and the
 * rows below them) rendered only when the snapshot happened to carry the key.
 * Normalize at the render boundary instead.
 */
export const sessionBadges = (badges: unknown): string[] =>
  Array.isArray(badges)
    ? badges.filter((b): b is string => typeof b === 'string' && b.length > 0)
    : [];
