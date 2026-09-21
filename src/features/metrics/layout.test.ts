import { describe, expect, it } from 'vitest';

import { SECTION_IDS, orderedIds, visibleIds, type MetricsLayout } from './layout';

describe('metrics layout', () => {
  it('falls back to the shipped order when nothing was arranged', () => {
    expect(visibleIds(null)).toEqual(SECTION_IDS);
  });

  it('follows the order the user dragged', () => {
    const order = [...SECTION_IDS].reverse();
    expect(orderedIds({ order, hidden: [] })).toEqual(order);
  });

  it('drops hidden sections from the tab but keeps them in the customize list', () => {
    const layout: MetricsLayout = { order: SECTION_IDS, hidden: [SECTION_IDS[0]] };
    expect(visibleIds(layout)).toEqual(SECTION_IDS.slice(1));
    expect(orderedIds(layout)).toEqual(SECTION_IDS);
  });

  // A layout saved by an older build cannot know about a section shipped later,
  // and must not make it disappear.
  it('appends a section the saved layout has never seen', () => {
    const result = orderedIds({ order: [SECTION_IDS[1]], hidden: [] });
    expect(result[0]).toBe(SECTION_IDS[1]);
    expect([...result].sort()).toEqual([...SECTION_IDS].sort());
  });

  it('ignores an id that no longer exists', () => {
    const layout = { order: ['retired', ...SECTION_IDS], hidden: [] } as unknown as MetricsLayout;
    expect(orderedIds(layout)).toEqual(SECTION_IDS);
  });

  it('keeps hiding honest when the hidden list names something unknown', () => {
    const layout = { order: SECTION_IDS, hidden: ['retired'] } as unknown as MetricsLayout;
    expect(visibleIds(layout)).toEqual(SECTION_IDS);
  });
});
