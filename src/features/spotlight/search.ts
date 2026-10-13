import type { Href } from 'expo-router';

import { searchDocs, type DocSection } from '@/features/docs';
import { fold } from '@/lib/text';

/**
 * One search over everything the app can open: screens, the exercise library,
 * the guides and the calculators. Pure — the provider hands in the sources it
 * loaded at open time and routes the hit it gets back. Prefix matches rank
 * first within a group; the guides keep their own title > tags > body ranking.
 */
export type SpotlightHit = { id: string; title: string; subtitle?: string; href: Href };

export type SpotlightGroupKey = 'screens' | 'exercises' | 'guides' | 'calculators';
export type SpotlightGroup = { key: SpotlightGroupKey; hits: SpotlightHit[] };

export type SpotlightSources = {
  screens: readonly SpotlightHit[];
  /** `title` is the display name; `alt` the other-language or raw name, matched too. */
  exercises: readonly (SpotlightHit & { alt?: string })[];
  docs: readonly DocSection[];
  calculators: readonly SpotlightHit[];
};

const PER_GROUP = 5;

/** Prefix hits first, then substring hits, each in source order. */
const rank = <T extends SpotlightHit & { alt?: string }>(items: readonly T[], q: string): T[] => {
  const keys = (hit: T) => [fold(hit.title), hit.alt ? fold(hit.alt) : ''];
  const prefix = items.filter((h) => keys(h).some((k) => k.startsWith(q)));
  const rest = items.filter((h) => !prefix.includes(h) && keys(h).some((k) => k.includes(q)));
  return [...prefix, ...rest];
};

export const spotlightSearch = (
  query: string,
  sources: SpotlightSources,
  perGroup = PER_GROUP,
): SpotlightGroup[] => {
  const q = fold(query.trim());
  if (!q) return [];
  const groups: SpotlightGroup[] = [
    { key: 'screens', hits: rank(sources.screens, q).slice(0, perGroup) },
    { key: 'exercises', hits: rank(sources.exercises, q).slice(0, perGroup) },
    {
      key: 'guides',
      hits: searchDocs([...sources.docs], q)
        .slice(0, perGroup)
        .map((d) => ({
          id: d.id,
          title: d.title,
          href: { pathname: '/docs/[id]', params: { id: d.id } },
        })),
    },
    { key: 'calculators', hits: rank(sources.calculators, q).slice(0, perGroup) },
  ];
  return groups.filter((g) => g.hits.length > 0);
};
