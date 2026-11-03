import { describe, expect, it } from 'vitest';

import { docSections } from './doc-sections';
import { en } from './content/en';

describe('docSections', () => {
  it('cuts before every second-level heading and loses nothing', () => {
    const body = 'Intro line.\n\n## One\nText\n\n### Sub\nMore\n## Two\nEnd';
    const parts = docSections(body);
    expect(parts).toEqual(['Intro line.\n', '## One\nText\n\n### Sub\nMore', '## Two\nEnd']);
    expect(parts.join('\n')).toBe(body);
  });

  it('keeps a body without headings whole', () => {
    expect(docSections('Just a paragraph.')).toEqual(['Just a paragraph.']);
  });

  it('never cuts inside a table of a shipped doc', () => {
    for (const doc of en) {
      for (const part of docSections(doc.body)) {
        expect(part.trimStart().startsWith('|')).toBe(false);
      }
    }
  });
});
