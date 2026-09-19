import { describe, expect, it } from 'vitest';

import { en } from './content/en';
import { es } from './content/es';

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
