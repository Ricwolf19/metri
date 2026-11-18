import { describe, expect, it } from 'vitest';

import type { ProgressCheckin, ProgressPhoto, ProgressPose } from '@/db/schema';

import {
  commonestPose,
  comparable,
  filterTimeline,
  ghostFor,
  groupCheckins,
  nextMissingPose,
} from './checkins';
import { deltaWeightText, avgWeightText } from './format';
import { joinMediaUri } from './media-path';
import { checkinStats, compareDelta, phaseOn } from './stats';

const checkin = (id: string, date: string): ProgressCheckin => ({
  id,
  userId: 'u',
  date,
  note: null,
  createdAt: new Date(`${date}T08:00:00`),
  updatedAt: new Date(`${date}T08:00:00`),
});

let seq = 0;
const media = (
  checkinId: string | null,
  pose: ProgressPose | null,
  kind: 'photo' | 'video' = 'photo',
): ProgressPhoto => {
  seq += 1;
  return {
    id: `m${seq}`,
    userId: 'u',
    uri: `m${seq}.jpg`,
    thumbUri: `m${seq}_thumb.jpg`,
    takenAt: new Date(2026, 10, 1, 8, seq),
    weightKg: null,
    note: null,
    checkinId,
    kind,
    pose,
    width: null,
    height: null,
    durationMs: kind === 'video' ? 8000 : null,
    align: null,
    createdAt: new Date(),
  };
};

describe('groupCheckins', () => {
  it('orders photos by pose, keeps clips apart and drops media of no check-in', () => {
    const c = checkin('c1', '2026-11-10');
    const [entry] = groupCheckins(
      [c],
      [media('c1', 'flex'), media('c1', 'front'), media('c1', null, 'video'), media(null, 'back')],
    );
    expect(entry.photos.map((p) => p.pose)).toEqual(['front', 'flex']);
    expect(entry.videos).toHaveLength(1);
  });
});

describe('nextMissingPose', () => {
  it('walks the poses in capture order, wrapping from where it starts', () => {
    const [entry] = groupCheckins(
      [checkin('c1', '2026-11-10')],
      [media('c1', 'front'), media('c1', 'left')],
    );
    expect(nextMissingPose(entry)).toBe('back');
    expect(nextMissingPose(entry, 'left')).toBe('right');
    expect(nextMissingPose(null)).toBe('front');
  });

  it('is null once every pose is in', () => {
    const c = checkin('c1', '2026-11-10');
    const [entry] = groupCheckins(
      [c],
      (['front', 'back', 'left', 'right', 'flex'] as const).map((p) => media('c1', p)),
    );
    expect(nextMissingPose(entry)).toBeNull();
  });
});

describe('ghostFor', () => {
  const entries = groupCheckins(
    [checkin('c3', '2026-11-17'), checkin('c2', '2026-11-10'), checkin('c1', '2026-11-03')],
    [media('c3', 'front'), media('c2', 'back'), media('c1', 'front')],
  );

  it('lays the latest earlier photo of the pose over the camera, skipping the check-in itself', () => {
    expect(ghostFor(entries, 'front', { id: null, date: '2026-11-18' })?.checkinId).toBe('c3');
    expect(ghostFor(entries, 'front', { id: 'c3', date: '2026-11-17' })?.checkinId).toBe('c1');
  });

  it('falls back to a later one when nothing earlier has the pose', () => {
    expect(ghostFor(entries, 'back', { id: 'c1', date: '2026-11-03' })?.checkinId).toBe('c2');
    expect(ghostFor(entries, 'flex', { id: null, date: '2026-11-18' })).toBeNull();
  });
});

describe('timeline filters', () => {
  const entries = groupCheckins(
    [checkin('c2', '2026-11-10'), checkin('c1', '2026-11-03')],
    [media('c2', 'front'), media('c2', null, 'video'), media('c1', 'front'), media('c1', 'back')],
  );

  it('keeps check-ins holding the pose, or a clip', () => {
    expect(filterTimeline(entries, 'back').map((e) => e.checkin.id)).toEqual(['c1']);
    expect(filterTimeline(entries, 'video').map((e) => e.checkin.id)).toEqual(['c2']);
    expect(filterTimeline(entries, 'all')).toHaveLength(2);
  });

  it('compares oldest first on the pose most check-ins share', () => {
    expect(commonestPose(entries)).toBe('front');
    expect(comparable(entries, 'front').map((e) => e.checkin.id)).toEqual(['c1', 'c2']);
  });
});

describe('checkinStats', () => {
  const weighIns = [
    { date: '2026-11-01', weightKg: 90 },
    { date: '2026-11-04', weightKg: 82 },
    { date: '2026-11-08', weightKg: 81 },
    { date: '2026-11-10', weightKg: 80 },
  ];
  const tape = [
    { date: '2026-10-20', valueCm: 90 },
    { date: '2026-11-02', valueCm: 86 },
  ];

  it('averages the seven days ending on the check-in and reads tape from the last two weeks', () => {
    const stats = checkinStats('2026-11-10', { weighIns, tape, goals: [] });
    expect(stats.avgKg).toBe(81);
    expect(stats.weighIns).toBe(3);
    expect(stats.siteCm).toBe(86);
    expect(checkinStats('2026-11-20', { weighIns, tape, goals: [] }).siteCm).toBeNull();
  });

  it('names the phase and its week, the newest started one winning', () => {
    const goals = [
      { phase: 'bulk' as const, startDate: '2026-06-01', endedAt: new Date(2026, 8, 30) },
      { phase: 'cut' as const, startDate: '2026-10-01', endedAt: null },
    ];
    expect(phaseOn(goals, '2026-11-10')).toEqual({ phase: 'cut', week: 6 });
    expect(phaseOn(goals, '2026-07-01')).toEqual({ phase: 'bulk', week: 5 });
    expect(phaseOn(goals, '2026-05-01')).toBeNull();
  });

  it('measures a comparison from before to after', () => {
    const before = {
      date: '2026-11-03',
      stats: checkinStats('2026-11-03', { weighIns, tape, goals: [] }),
    };
    const after = {
      date: '2026-11-10',
      stats: checkinStats('2026-11-10', { weighIns, tape, goals: [] }),
    };
    expect(compareDelta(before, after)).toEqual({ days: 7, kg: -9, cm: 0 });
  });
});

describe('format', () => {
  it('marks a thin average and signs every change', () => {
    expect(avgWeightText({ avgKg: 81.25, weighIns: 2, siteCm: null, phase: null }, 'kg')).toBe(
      '~81.3 kg',
    );
    expect(deltaWeightText(-6.2, 'kg')).toBe('−6.2 kg');
    expect(deltaWeightText(0, 'kg')).toBe('±0 kg');
  });
});

describe('joinMediaUri', () => {
  it('finds a stored file by its name in the current folder', () => {
    expect(joinMediaUri('file:///new/progress/', 'file:///old/progress/abc.jpg')).toBe(
      'file:///new/progress/abc.jpg',
    );
    expect(joinMediaUri('file:///new/progress', 'abc.jpg')).toBe('file:///new/progress/abc.jpg');
    expect(joinMediaUri('file:///new/progress/', '')).toBe('');
  });
});
