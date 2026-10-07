import { describe, expect, it } from 'vitest';

import type { Equipment } from '@/db/schema';

import {
  LOAD_KIND_FOR,
  defaultHands,
  describeLoad,
  hasLoadDetail,
  kgToUnit,
  loadTotalKg,
  machineLoads,
  reconcileLoad,
  setVolumeKg,
  snapPlate,
  stackPlates,
  unitToKg,
  unstackPlates,
  type LoadDetail,
} from './load';

const barbell: LoadDetail = { kind: 'barbell', barKg: 20, platesKg: [20, 10, 2.5] };
const machine: LoadDetail = { kind: 'machine', baseKg: 10, incrementKg: 5, steps: 6 };
const dumbbells: LoadDetail = { kind: 'dumbbell', perHandKg: 30, hands: 2 };

describe('loadTotalKg', () => {
  it.each<[string, LoadDetail, number]>([
    ['bar + both sides', barbell, 85],
    ['plate-loaded machine (no bar)', { kind: 'barbell', barKg: 0, platesKg: [25] }, 50],
    ['stack', machine, 40],
    ['two dumbbells', dumbbells, 60],
    ['one dumbbell (unilateral)', { kind: 'dumbbell', perHandKg: 30, hands: 1 }, 30],
  ])('%s', (_, load, total) => {
    expect(loadTotalKg(load)).toBe(total);
  });
});

describe('setVolumeKg', () => {
  it('uses the derived total when a detail exists', () => {
    expect(setVolumeKg({ weightKg: 30, reps: 10, load: dumbbells })).toBe(600);
  });

  it('falls back to the typed number for a plain or pre-upgrade row', () => {
    expect(setVolumeKg({ weightKg: 30, reps: 10, load: null })).toBe(300);
  });
});

describe('plate stacks', () => {
  it('counts duplicates and keeps the loading order (largest first)', () => {
    expect(stackPlates([10, 20, 20, 2.5])).toEqual([
      { plate: 20, count: 2 },
      { plate: 10, count: 1 },
      { plate: 2.5, count: 1 },
    ]);
  });

  it('round-trips through unstack', () => {
    const plates = [25, 20, 20, 5, 1.25];
    expect(unstackPlates(stackPlates(plates))).toEqual(plates);
  });
});

describe('machineLoads', () => {
  it('offers the pins from the base up to the cap', () => {
    expect(machineLoads(10, 5, 4)).toEqual([10, 15, 20, 25, 30]);
  });

  it('offers nothing without an increment', () => {
    expect(machineLoads(10, 0)).toEqual([]);
  });

  it('guards float noise on quarter steps', () => {
    expect(machineLoads(0, 1.25, 3)).toEqual([0, 1.25, 2.5, 3.75]);
  });
});

describe('units', () => {
  it('maps every equipment to a sheet mode', () => {
    const all: Equipment[] = [
      'barbell',
      'dumbbell',
      'machine',
      'cable',
      'bodyweight',
      'kettlebell',
      'other',
    ];
    for (const e of all) expect(e in LOAD_KIND_FOR).toBe(true);
    expect(LOAD_KIND_FOR.cable).toBe('machine');
    expect(LOAD_KIND_FOR.bodyweight).toBeNull();
  });

  it('survives an lb round-trip through kg storage', () => {
    for (const lb of [45, 35, 25, 10, 5, 2.5]) {
      expect(snapPlate(unitToKg(lb, 'lb'), 'lb')).toBe(lb);
    }
    expect(kgToUnit(unitToKg(132.28, 'lb'), 'lb')).toBe(132.28);
  });

  it('keeps a plate no rack offers rather than forcing a denomination', () => {
    // 7 kg is not within 2 % of 5 or 10.
    expect(snapPlate(7, 'kg')).toBe(7);
  });

  it('describes a load in the display unit', () => {
    expect(describeLoad(barbell, 'kg')).toEqual({ total: 85, parts: '20 + 2×(20, 10, 2.5)' });
    expect(describeLoad({ kind: 'barbell', barKg: 20, platesKg: [20, 20] }, 'kg').parts).toBe(
      '20 + 2×(20×2)',
    );
    expect(describeLoad(machine, 'kg')).toEqual({ total: 40, parts: '10 + 6×5' });
    expect(describeLoad(dumbbells, 'kg')).toEqual({ total: 60, parts: '2 × 30' });
    expect(describeLoad(dumbbells, 'lb').total).toBe(132.28);
  });
});

describe('reconcileLoad', () => {
  it('keeps a sheet-built detail that still adds up to the row', () => {
    expect(reconcileLoad({ draft: barbell, setting: null, weightKg: 85, unilateral: false })).toBe(
      barbell,
    );
  });

  it('tolerates the 2-decimal rounding of the row text', () => {
    const load: LoadDetail = { kind: 'barbell', barKg: 20, platesKg: [20.412] };
    expect(reconcileLoad({ draft: load, setting: null, weightKg: 60.82, unilateral: false })).toBe(
      load,
    );
  });

  it('drops a detail the lifter typed over', () => {
    expect(
      reconcileLoad({ draft: barbell, setting: null, weightKg: 90, unilateral: false }),
    ).toBeNull();
  });

  it('follows the typed per-hand number for a dumbbell draft', () => {
    expect(
      reconcileLoad({ draft: dumbbells, setting: null, weightKg: 32.5, unilateral: false }),
    ).toEqual({ kind: 'dumbbell', perHandKg: 32.5, hands: 2 });
  });

  it('synthesises ×2 for a dumbbell exercise logged without the sheet', () => {
    expect(
      reconcileLoad({ draft: null, setting: dumbbells, weightKg: 20, unilateral: false }),
    ).toEqual({ kind: 'dumbbell', perHandKg: 20, hands: 2 });
    expect(
      reconcileLoad({ draft: null, setting: dumbbells, weightKg: 20, unilateral: true }),
    ).toEqual({ kind: 'dumbbell', perHandKg: 20, hands: 1 });
  });

  it('is a plain number otherwise', () => {
    expect(
      reconcileLoad({ draft: null, setting: barbell, weightKg: 85, unilateral: false }),
    ).toBeNull();
    expect(
      reconcileLoad({ draft: null, setting: null, weightKg: 85, unilateral: false }),
    ).toBeNull();
  });

  it('defaults hands by the unilateral flag', () => {
    expect(defaultHands(true)).toBe(1);
    expect(defaultHands(false)).toBe(2);
    expect(defaultHands(undefined)).toBe(2);
    expect(hasLoadDetail({ load: dumbbells })).toBe(true);
    expect(hasLoadDetail(null)).toBe(false);
  });
});
