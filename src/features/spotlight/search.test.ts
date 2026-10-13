import { describe, expect, it } from 'vitest';

import type { DocSection } from '@/features/docs';

import { spotlightSearch, type SpotlightSources } from './search';

const doc = (id: string, title: string, tags: string[] = []): DocSection => ({
  id,
  category: 'training',
  title,
  tags,
  body: `${title} body text long enough to count as a real section of the knowledge base.`,
});

const sources: SpotlightSources = {
  screens: [
    { id: 'train', title: 'Train', href: '/training' },
    { id: 'metrics', title: 'Metrics', href: '/metrics' },
  ],
  exercises: [
    { id: 'press', title: 'Press banca', alt: 'Bench Press', href: '/training/exercises' },
    { id: 'curl', title: 'Curl Araña', href: '/training/exercises' },
    { id: 'incline', title: 'Incline Bench Press', href: '/training/exercises' },
  ],
  docs: [
    doc('progressive-overload', 'Progressive overload', ['hypertrophy']),
    doc('rm', 'When to test a max', ['1rm']),
  ],
  calculators: [{ id: 'onerm', title: '1RM', href: '/calculators/onerm' }],
};

describe('spotlightSearch', () => {
  it('returns nothing for an empty query and only the groups that matched', () => {
    expect(spotlightSearch('   ', sources)).toEqual([]);
    expect(spotlightSearch('metr', sources).map((g) => g.key)).toEqual(['screens']);
  });

  it('matches exercises in either language, accent-insensitive, prefix first', () => {
    const [group] = spotlightSearch('bench', sources);
    expect(group.key).toBe('exercises');
    expect(group.hits.map((h) => h.id)).toEqual(['press', 'incline']);
    expect(spotlightSearch('arana', sources)[0].hits[0].id).toBe('curl');
  });

  it('routes a guide hit to its doc and a calculator hit to its screen', () => {
    const groups = spotlightSearch('1rm', sources);
    const guides = groups.find((g) => g.key === 'guides');
    const calcs = groups.find((g) => g.key === 'calculators');
    expect(guides?.hits[0].href).toEqual({ pathname: '/docs/[id]', params: { id: 'rm' } });
    expect(calcs?.hits[0].href).toBe('/calculators/onerm');
  });

  it('caps every group', () => {
    const many = {
      ...sources,
      screens: Array.from({ length: 9 }, (_, i) => ({
        id: `s${i}`,
        title: `Screen ${i}`,
        href: '/training' as const,
      })),
    };
    expect(spotlightSearch('screen', many, 3)[0].hits).toHaveLength(3);
  });
});
