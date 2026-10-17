import type { Locale } from '@/i18n';
import { fold as norm } from '@/lib/text';

import { en } from './content/en';
import { es } from './content/es';
import type { DocSection } from './types';

export type { DocSection } from './types';

export const getDocs = (locale: Locale): DocSection[] => (locale === 'es' ? es : en);

export const getDocById = (locale: Locale, id: string): DocSection | null =>
  getDocs(locale).find((d) => d.id === id) ?? null;

type Folded = { d: DocSection; title: string; tags: string; body: string };

// Folding ~100 KB of bodies on every keystroke was the typing jank in Explore:
// each docs array (one per locale, module constants) is folded once.
const FOLDED = new WeakMap<readonly DocSection[], Folded[]>();

const foldedDocs = (docs: readonly DocSection[]): Folded[] => {
  const hit = FOLDED.get(docs);
  if (hit) return hit;
  const folded = docs.map((d) => ({
    d,
    title: norm(d.title),
    tags: norm(d.tags.join(' ')),
    body: norm(d.body),
  }));
  FOLDED.set(docs, folded);
  return folded;
};

/** Rank by where the query hits: title > tags > body. Accent-insensitive. */
export const searchDocs = (docs: readonly DocSection[], query: string): DocSection[] => {
  const q = norm(query.trim());
  if (!q) return [];
  const terms = q.split(/\s+/);

  return foldedDocs(docs)
    .map(({ d, title, tags, body }) => {
      let score = 0;
      for (const term of terms) {
        if (title.includes(term)) score += 5;
        if (tags.includes(term)) score += 3;
        if (body.includes(term)) score += 1;
      }
      return { d, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.d);
};
