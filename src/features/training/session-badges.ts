/**
 * Session badges as they can appear in a stored `plannedSnapshot`. Snapshots
 * written before the badges key existed deserialize with `badges: undefined`,
 * and a `.length` read on that row broke the card list — the badges (and the
 * rows below them) rendered only when the snapshot happened to carry the key.
 * Normalize at the render boundary instead.
 */
/**
 * Cues a preset used to carry and no longer does. A snapshot froze them at
 * session start and an enrolled copy at enrollment, so the seed cannot reach
 * them; hiding at the render boundary is what keeps the old cue off the card.
 */
const RETIRED_BADGES: ReadonlySet<string> = new Set(['O similar']);

export const sessionBadges = (badges: unknown): string[] =>
  Array.isArray(badges)
    ? badges.filter(
        (b): b is string => typeof b === 'string' && b.length > 0 && !RETIRED_BADGES.has(b),
      )
    : [];
