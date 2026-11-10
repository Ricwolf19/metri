import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.mock('@/lib/storage', () => ({
  SettingKeys: {},
  storage: {
    getString: (k: string) => store.get(k),
    set: (k: string, v: string) => store.set(k, v),
  },
}));

const { MISSED } = await import('@/features/training/adherence-colors');
const { currentWeekKeys, dayVisual, readWidgetSnapshot, weekA11yLabel, WIDGET_COLORS } =
  await import('./snapshot');

describe('currentWeekKeys', () => {
  it('is the week of today, Monday first, like the Train tab', () => {
    // 2026-11-04 is a Wednesday.
    expect(currentWeekKeys('2026-11-04')).toEqual([
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
    ]);
  });

  it('puts a Sunday at the END of its week, across a month boundary', () => {
    const week = currentWeekKeys('2026-11-01');
    expect(week[0]).toBe('2026-10-26');
    expect(week[6]).toBe('2026-11-01');
  });
});

describe('dayVisual', () => {
  it('paints the adherence colours of the app', () => {
    expect(dayVisual('trained', 'past')).toMatchObject({ bg: WIDGET_COLORS.brand });
    expect(dayVisual('skipped', 'past')).toMatchObject({ bg: MISSED, fg: WIDGET_COLORS.onBrand });
    expect(dayVisual('rest', 'past').bg).not.toBe(dayVisual('none', 'past').bg);
  });

  it('marks missed and rest by more than colour', () => {
    expect(dayVisual('skipped', 'past').cross).toBe(true);
    expect(dayVisual('trained', 'past').cross).toBe(false);
    expect(dayVisual('rest', 'past').outline).toBe(true);
    expect(dayVisual('none', 'past').outline).toBe(false);
  });

  it('writes near-black letters on the other-activity fill (brand read 3.28:1)', () => {
    expect(dayVisual('active', 'past')).toMatchObject({
      bg: WIDGET_COLORS.muted,
      fg: WIDGET_COLORS.onBrand,
    });
  });

  it('rings only today while it is unmarked', () => {
    expect(dayVisual('none', 'today').ring).toBe(true);
    expect(dayVisual('trained', 'today').ring).toBe(false);
    expect(dayVisual('none', 'future').ring).toBe(false);
  });

  it('resolves every colour to hex for RemoteViews', () => {
    for (const value of Object.values(WIDGET_COLORS)) expect(value).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('weekA11yLabel', () => {
  // Echoes the key and its vars, so the test reads the structure, not a dictionary.
  const t = (key: string, vars?: Record<string, string | number>) =>
    vars ? `${key}(${Object.values(vars).join('')})` : key;

  it('names every day and its status, and only the weekday for the days ahead', () => {
    const label = weekA11yLabel(
      [
        { date: '2026-11-02', status: 'trained' },
        { date: '2026-11-03', status: 'skipped' },
        { date: '2026-11-04', status: 'none' },
        { date: '2026-11-05', status: 'none' },
      ],
      '2026-11-04',
      t,
    );
    expect(label).toBe(
      'widget.weekA11y(weekday.mon, adherence.trained; weekday.tue, adherence.skipped; ' +
        'weekday.wed, adherence.unmarked; weekday.thu)',
    );
  });
});

describe('readWidgetSnapshot', () => {
  beforeEach(() => store.clear());

  it('reads nothing from an older build’s snapshot instead of throwing in a headless render', () => {
    store.set('widget.snapshot', JSON.stringify({ tdee: 2400, trainedToday: true, week: [] }));
    expect(readWidgetSnapshot()).toBeNull();
    store.set('widget.snapshot', '{not json');
    expect(readWidgetSnapshot()).toBeNull();
  });
});
