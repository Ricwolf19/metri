import { describe, expect, it } from 'vitest';

import type { ProgressPhoto, ProgressPose } from '@/db/schema';
import type { TFunction } from '@/i18n';
import { en } from '@/i18n/en';

import { panelGrid, progressShareModel, spreadPicks, templateFor } from './share-model';
import type { CheckinStats } from './stats';
import type { ProgressEntry } from './useProgressLog';

// The real English copy, interpolated like `t()` (the provider module loads React Native).
const t: TFunction = (key, vars) =>
  en[key].replace(/\{(\w+)\}/g, (_, name: string) => String(vars?.[name] ?? `{${name}}`));

const photo = (id: string, checkinId: string, pose: ProgressPose): ProgressPhoto => ({
  id,
  userId: 'u',
  uri: `file:///docs/progress/${id}.jpg`,
  thumbUri: `file:///docs/progress/${id}_thumb.jpg`,
  takenAt: new Date(2026, 7, 12, 8),
  weightKg: null,
  note: null,
  checkinId,
  kind: 'photo',
  pose,
  width: 1620,
  height: 2160,
  durationMs: null,
  align: null,
  createdAt: new Date(),
});

const entry = (
  id: string,
  date: string,
  stats: Partial<CheckinStats>,
  poses: ProgressPose[] = ['front'],
): ProgressEntry => ({
  checkin: { id, userId: 'u', date, note: null, createdAt: new Date(), updatedAt: new Date() },
  photos: poses.map((pose) => photo(`${id}-${pose}`, id, pose)),
  videos: [],
  stats: { avgKg: null, weighIns: 7, siteCm: null, phase: null, ...stats },
});

const start = entry('c1', '2026-08-12', {
  avgKg: 84.1,
  siteCm: 92,
  phase: { phase: 'cut', week: 1 },
});
const mid = entry('c2', '2026-09-23', { avgKg: 80.5, siteCm: 88 }, ['back']);
const end = entry('c3', '2026-11-04', {
  avgKg: 77.9,
  siteCm: 84,
  phase: { phase: 'cut', week: 13 },
});

const build = (entries: ProgressEntry[], stats: 'changes' | 'full' | 'none' = 'changes') =>
  progressShareModel({
    entries,
    pose: 'front',
    stats,
    units: 'kg',
    siteLabel: 'Waist',
    dayMonth: (key) => key.slice(5),
    t,
  });

describe('templateFor', () => {
  it('follows the count', () => {
    expect([1, 2, 3, 4].map(templateFor)).toEqual(['single', 'pair', 'timeline', 'timeline']);
  });
});

describe('progressShareModel', () => {
  it('pairs the first and last check-in holding the pose, labelled by phase week', () => {
    const model = build([start, mid, end]);
    expect(model.template).toBe('pair');
    expect(model.eyebrow).toBe('Progress · Front');
    expect(model.title).toBe('08-12 → 11-04');
    expect(model.panels.map((p) => [p.label, p.sublabel])).toEqual([
      ['Cut · week 1', '08-12'],
      ['Cut · week 13', '11-04'],
    ]);
  });

  it('shows only what moved by default — never a body weight', () => {
    const { chips } = build([start, end]);
    expect(chips).toEqual([
      { label: 'Weight', value: '−6.2 kg', detail: null },
      { label: 'Waist', value: '−8 cm', detail: null },
      { label: 'Time', value: '84 days', detail: null },
    ]);
  });

  it('adds the weekly averages on full, and nothing on none', () => {
    expect(build([start, end], 'full').chips[0]).toEqual({
      label: 'Weight',
      value: '−6.2 kg',
      detail: '84.1 kg → 77.9 kg',
    });
    expect(build([start, end], 'none').chips).toEqual([]);
  });

  it('labels a check-in outside a phase by its date, and leaves out a number it lacks', () => {
    const plain = entry('c9', '2026-12-01', { avgKg: 77, siteCm: null });
    const model = build([end, plain]);
    expect(model.panels[1]).toMatchObject({ label: '12-01', sublabel: null });
    expect(model.chips.map((c) => c.label)).toEqual(['Weight', 'Time']);
  });

  it('prints a single check-in’s numbers only on full', () => {
    expect(build([end]).chips).toEqual([]);
    expect(build([end], 'full').chips.map((c) => c.value)).toEqual(['77.9 kg', '84 cm']);
    expect(build([end]).title).toBe('Cut · week 13');
  });

  it('keeps at most four panels', () => {
    const many = ['a', 'b', 'c', 'd', 'e'].map((id, i) => entry(id, `2026-0${i + 1}-01`, {}));
    const model = build(many);
    expect(model.panels).toHaveLength(4);
    expect(model.template).toBe('timeline');
  });
});

describe('panelGrid', () => {
  it('draws the largest photos the area allows', () => {
    // A pair on a square card: side by side.
    expect(panelGrid(2, { width: 320, height: 220 }, 8)).toMatchObject({ cols: 2, rows: 1 });
    // Four on a story: two by two.
    expect(panelGrid(4, { width: 320, height: 420 }, 8)).toMatchObject({ cols: 2, rows: 2 });
    // One fills the height of a wide area, at 3:4.
    expect(panelGrid(1, { width: 320, height: 200 }, 8)).toEqual({
      cols: 1,
      rows: 1,
      width: 150,
      height: 200,
    });
  });
});

describe('spreadPicks', () => {
  it('keeps the ends and spreads the rest evenly', () => {
    expect(spreadPicks([1, 2, 3])).toEqual([1, 2, 3]);
    expect(spreadPicks([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual([0, 3, 6, 9]);
  });
});
