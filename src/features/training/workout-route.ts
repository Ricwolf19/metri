/**
 * Navigation identity of the live-session screen: one instance per workout,
 * whatever else rides in the params. The tab's Resume card, the launch focus
 * and the rest notification (`?slot=`) all push this route; without a stable
 * id each push stacked another copy, and returning to a buried copy (stale
 * `log`, its own sheets still mounted) is what left sets that would not check
 * off. `slot` is deliberately NOT part of the id — it only picks the card.
 */
export const workoutScreenId = (params: Record<string, unknown>): string | undefined =>
  typeof params.id === 'string' && params.id !== '' ? `workout:${params.id}` : undefined;
