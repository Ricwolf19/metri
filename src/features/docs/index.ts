import type { Locale } from '@/i18n';

import { en } from './content/en';
import { es } from './content/es';
import type { DocSection } from './types';

export { DOC_CATEGORIES } from './types';
export type { DocSection } from './types';

export const getDocs = (locale: Locale): DocSection[] => (locale === 'es' ? es : en);

export const getDocById = (locale: Locale, id: string): DocSection | null =>
  getDocs(locale).find((d) => d.id === id) ?? null;

/** Lowercase + strip accents (NFD-decompose, drop combining marks) for matching. */
const norm = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Rank by where the query hits: title > tags > body. Accent-insensitive. */
export const searchDocs = (docs: DocSection[], query: string): DocSection[] => {
  const q = norm(query.trim());
  if (!q) return [];
  const terms = q.split(/\s+/);

  return docs
    .map((d) => {
      const title = norm(d.title);
      const tags = norm(d.tags.join(' '));
      const body = norm(d.body);
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
