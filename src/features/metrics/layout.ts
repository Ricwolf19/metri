/**
 * Which sections the Metrics tab shows and in what order — ids only, no
 * components, so the resolution stays pure and testable on its own.
 *
 * Ids are persisted in MMKV: never rename or reuse one.
 */
export type MetricsSectionId =
  | 'consistency'
  | 'summary'
  | 'body'
  | 'analytics'
  | 'photos'
  | 'exercises'
  | 'exerciseTrends'
  | 'health';

/**
 * The order metri ships: the sections you WRITE to first — the body (weigh-in,
 * check-in) and the photo timeline — then the ones you read: are you showing
 * up, the headline numbers, the day's activity and sleep, where the work is
 * landing, what each movement did.
 * A saved layout keeps its own order (see `orderedIds`).
 */
export const SECTION_IDS: MetricsSectionId[] = [
  'body',
  'photos',
  'consistency',
  'summary',
  // Steps, active energy and sleep from the phone's health store (read, never written).
  'health',
  'analytics',
  'exercises',
  // Shipped after the others: a saved layout appends it (see `orderedIds`).
  'exerciseTrends',
];

/** What the user arranged: the order they dragged, plus what they switched off. */
export type MetricsLayout = { order: MetricsSectionId[]; hidden: MetricsSectionId[] };

const known = (id: string): id is MetricsSectionId => (SECTION_IDS as string[]).includes(id);

/**
 * Every section in the user's order, hidden ones included — what the customize
 * screen lists. A section shipped after the layout was saved is unknown to it,
 * so it joins the end instead of vanishing; an id that no longer exists is
 * dropped.
 */
export const orderedIds = (layout: MetricsLayout | null): MetricsSectionId[] => {
  const chosen = (layout?.order ?? []).filter(known);
  const seen = new Set(chosen);
  return [...chosen, ...SECTION_IDS.filter((id) => !seen.has(id))];
};

/** What the tab actually renders. */
export const visibleIds = (layout: MetricsLayout | null): MetricsSectionId[] => {
  const hidden = new Set(layout?.hidden ?? []);
  return orderedIds(layout).filter((id) => !hidden.has(id));
};
