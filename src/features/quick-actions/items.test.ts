import { describe, expect, it } from 'vitest';

import type { TFunction } from '@/i18n';
import { en } from '@/i18n/en';
import { es } from '@/i18n/es';

import { quickActionHref, quickActionItems } from './items';

const tFor =
  (dict: Record<string, string>): TFunction =>
  (key) =>
    dict[key] ?? key;

describe('quickActionItems', () => {
  it('titles every shortcut in the language asked for', () => {
    const english = quickActionItems(tFor(en), 'android');
    const spanish = quickActionItems(tFor(es), 'android');
    expect(english.map((a) => a.id)).toEqual(['train', 'checkin', 'food', 'photo']);
    expect(english.map((a) => a.title)).not.toEqual(spanish.map((a) => a.title));
    for (const a of [...english, ...spanish]) expect(a.title).not.toMatch(/^quickActions\./);
  });

  it('draws the launcher icon on Android and an SF symbol on iOS', () => {
    expect(quickActionItems(tFor(en), 'android')[0].icon).toBe('ic_launcher');
    expect(quickActionItems(tFor(en), 'ios')[0].icon).toMatch(/^symbol:/);
  });
});

describe('quickActionHref', () => {
  it('routes by our own id, never by a payload href', () => {
    expect(quickActionHref({ id: 'food' })).toBe('/food/add');
    expect(quickActionHref({ id: 'photo' })).toBe('/progress/capture');
    expect(quickActionHref({ id: 'elsewhere' })).toBeNull();
  });
});
