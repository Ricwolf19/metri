import { describe, expect, it } from 'vitest';

import { fold } from '@/lib/text';

import { en } from './content/en';
import { es } from './content/es';
import { searchDocs } from './index';

describe('knowledge base parity', () => {
  it('keeps the same id sequence in both languages', () => {
    expect(es.map((d) => d.id)).toEqual(en.map((d) => d.id));
  });

  it('has unique ids, non-empty bodies and lowercase tags', () => {
    for (const docs of [en, es]) {
      const ids = docs.map((d) => d.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const d of docs) {
        expect(d.body.trim().length, d.id).toBeGreaterThan(40);
        expect(d.tags.length, d.id).toBeGreaterThan(0);
        for (const tag of d.tags) expect(tag, d.id).toBe(tag.toLowerCase());
      }
    }
  });

  it('only links to docs that exist', () => {
    const ids = new Set(en.map((d) => d.id));
    for (const docs of [en, es]) {
      for (const d of docs) {
        for (const m of d.body.matchAll(/\]\((?:\/es)?\/docs\/([a-z0-9-]+)\)/g)) {
          expect(ids.has(m[1]), `${d.id} -> ${m[1]}`).toBe(true);
        }
      }
    }
  });
});

describe('searchDocs', () => {
  it('ranks a title hit above a body hit and is accent-insensitive', () => {
    const [first] = searchDocs(es, 'maximo');
    expect(first.id).toBe('when-to-test-rm');
  });

  it('returns the same ranking from the folded cache as from a fresh array', () => {
    const fresh = searchDocs([...en], 'protein').map((d) => d.id);
    expect(searchDocs(en, 'protein').map((d) => d.id)).toEqual(fresh);
    expect(searchDocs(en, 'protein').map((d) => d.id)).toEqual(fresh);
  });
});

describe('glossary', () => {
  const terms = (docs: typeof en): string[] =>
    [...(docs.find((d) => d.id === 'glossary')?.body ?? '').matchAll(/^\| \*\*(.+?)\*\*/gm)].map(
      (m) => m[1],
    );

  it('lists its terms alphabetically in both languages', () => {
    for (const docs of [en, es]) {
      const folded = terms(docs).map(fold);
      expect(folded).toEqual([...folded].sort());
    }
  });

  // The session's blue tag names "Unilateral"; the weight sheet's number is per hand.
  it('defines what a unilateral lift and a per-hand weight are', () => {
    expect(terms(en)).toEqual(expect.arrayContaining(['Unilateral', 'Per hand']));
    expect(terms(es)).toEqual(expect.arrayContaining(['Unilateral', 'Por mano']));
  });
});
