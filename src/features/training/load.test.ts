import { describe, expect, it } from 'vitest';

import type { Equipment } from '@/db/schema';

import {
  DEFAULT_BAR_KG,
  LOAD_KIND_FOR,
  PLATE_MACHINE_SEED,
  POST_MACHINE_SEED,
  STACK_MACHINE_SEED,
  clampInput,
  defaultHands,
  deriveLoad,
  describeLoad,
  hasLoadDetail,
  kgToUnit,
  loadFromSide,
  loadModesFor,
  loadTotalKg,
  machineLoadForTotal,
  machineLoadKind,
  machineLoads,
  reconcileLoad,
  rowInputMode,
  setVolumeKg,
  snapPlate,
  stackPlates,
  unitToKg,
  unstackPlates,
  type LoadDetail,
} from './load';
import { totalFromSide } from './plate-math';

const barbell: LoadDetail = { kind: 'barbell', barKg: 20, platesKg: [20, 10, 2.5] };
const machine: LoadDetail = { kind: 'machine', baseKg: 10, incrementKg: 5, steps: 6 };
const dumbbells: LoadDetail = { kind: 'dumbbell', perHandKg: 30, hands: 2 };

describe('loadTotalKg', () => {
  it.each<[string, LoadDetail, number]>([
    ['bar + both sides', barbell, 85],
    ['plate-loaded machine (no bar)', { kind: 'barbell', barKg: 0, platesKg: [25] }, 50],
    [
      'single post: the plates count once',
      { kind: 'barbell', barKg: 0, platesKg: [25, 10], sides: 1 },
      35,
    ],
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

  it('locks the sheet mode to the equipment and frees it only when unknown', () => {
    expect(loadModesFor('cable')).toEqual(['machine']);
    expect(loadModesFor('barbell')).toEqual(['barbell']);
    expect(loadModesFor('kettlebell')).toEqual(['dumbbell']);
    expect(loadModesFor('bodyweight')).toEqual(['none']);
    expect(loadModesFor('other')).toHaveLength(4);
    expect(loadModesFor(null)).toHaveLength(4);
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

describe('machine kind', () => {
  it('reads plates or stack off the saved config and nothing until chosen', () => {
    expect(machineLoadKind(null)).toBeNull();
    expect(machineLoadKind(PLATE_MACHINE_SEED)).toBe('plates');
    expect(machineLoadKind(STACK_MACHINE_SEED)).toBe('stack');
    expect(machineLoadKind(dumbbells)).toBeNull();
  });

  it('offers a machine both modes until its kind is chosen, then locks it', () => {
    expect(loadModesFor('machine')).toEqual(['barbell', 'machine']);
    expect(loadModesFor('machine', PLATE_MACHINE_SEED)).toEqual(['barbell']);
    expect(loadModesFor('machine', machine)).toEqual(['machine']);
  });
});

describe('machineLoadForTotal', () => {
  it('lands a total on its pin and refuses one between pins', () => {
    expect(machineLoadForTotal(40, machine)).toEqual({ ...machine, steps: 6 });
    expect(machineLoadForTotal(42, machine)).toBeNull();
    expect(machineLoadForTotal(5, machine)).toBeNull();
  });

  it('is nothing for an unconfigured stack or another kind', () => {
    expect(machineLoadForTotal(40, STACK_MACHINE_SEED)).toBeNull();
    expect(machineLoadForTotal(40, barbell)).toBeNull();
    expect(machineLoadForTotal(40, null)).toBeNull();
  });
});

describe('rowInputMode', () => {
  it('takes the per-side number on a bar (its saved bar, else the default)', () => {
    expect(rowInputMode({ equipment: 'barbell' }, null)).toEqual({
      mode: 'perSide',
      baseKg: DEFAULT_BAR_KG,
      sides: 2,
    });
    expect(rowInputMode({ equipment: 'barbell' }, { ...barbell, barKg: 15 })).toEqual({
      mode: 'perSide',
      baseKg: 15,
      sides: 2,
    });
  });

  it('takes the per-side number on a plate-loaded machine and the total on a stack', () => {
    expect(
      rowInputMode({ equipment: 'machine' }, { kind: 'barbell', barKg: 30, platesKg: [] }),
    ).toEqual({
      mode: 'perSide',
      baseKg: 30,
      sides: 2,
    });
    expect(rowInputMode({ equipment: 'machine' }, machine)).toEqual({ mode: 'total' });
    expect(rowInputMode({ equipment: 'machine' }, null)).toEqual({ mode: 'total' });
  });

  it('takes one dumbbell for dumbbells and kettlebells, the total otherwise', () => {
    expect(rowInputMode({ equipment: 'dumbbell' }, null)).toEqual({ mode: 'perHand' });
    expect(rowInputMode({ equipment: 'kettlebell' }, null)).toEqual({ mode: 'perHand' });
    expect(rowInputMode({ equipment: 'cable' }, null)).toEqual({ mode: 'total' });
    expect(rowInputMode(null, null)).toEqual({ mode: 'total' });
  });
});

describe('loadFromSide / deriveLoad', () => {
  it('splits a per-side weight onto the rack, largest first', () => {
    expect(loadFromSide(22.5, 20, 'kg')).toEqual({
      kind: 'barbell',
      barKg: 20,
      platesKg: [20, 2.5],
    });
    expect(loadFromSide(1.25, 0, 'kg')).toEqual({ kind: 'barbell', barKg: 0, platesKg: [1.25] });
    expect(loadFromSide(1, 20, 'lb')).toBeNull();
  });

  it('re-derives the plates after a bump instead of dropping them', () => {
    const side = { mode: 'perSide', baseKg: 20, sides: 2 } as const;
    const before = deriveLoad({
      mode: side,
      value: 20,
      unit: 'kg',
      setting: null,
      current: null,
      unilateral: false,
    });
    const after = deriveLoad({
      mode: side,
      value: 22.5,
      unit: 'kg',
      setting: null,
      current: before,
      unilateral: false,
    });
    expect(before?.kind === 'barbell' && before.platesKg).toEqual([20]);
    expect(after?.kind === 'barbell' && after.platesKg).toEqual([20, 2.5]);
  });

  it('adds back up in lb: the derived detail matches the row total within the tolerance', () => {
    const baseLb = kgToUnit(20, 'lb'); // 44.09, as the prefix shows it
    const load = deriveLoad({
      mode: { mode: 'perSide', baseKg: 20, sides: 2 },
      value: 45,
      unit: 'lb',
      setting: null,
      current: null,
      unilateral: false,
    });
    const rowKg = unitToKg(totalFromSide(45, baseLb), 'lb');
    expect(load).not.toBeNull();
    expect(Math.abs(loadTotalKg(load!) - rowKg)).toBeLessThan(0.02);
    expect(reconcileLoad({ draft: load, setting: null, weightKg: rowKg, unilateral: false })).toBe(
      load,
    );
  });

  it('keeps the hands a dumbbell row already chose, else the saved ones, else the flag', () => {
    const perHand = { mode: 'perHand' } as const;
    expect(
      deriveLoad({
        mode: perHand,
        value: 30,
        unit: 'kg',
        setting: null,
        current: null,
        unilateral: true,
      }),
    ).toEqual({ kind: 'dumbbell', perHandKg: 30, hands: 1 });
    expect(
      deriveLoad({
        mode: perHand,
        value: 30,
        unit: 'kg',
        setting: dumbbells,
        current: null,
        unilateral: true,
      }),
    ).toEqual({ kind: 'dumbbell', perHandKg: 30, hands: 2 });
    expect(
      deriveLoad({
        mode: perHand,
        value: 32.5,
        unit: 'kg',
        setting: dumbbells,
        current: { kind: 'dumbbell', perHandKg: 30, hands: 1 },
        unilateral: false,
      }),
    ).toEqual({ kind: 'dumbbell', perHandKg: 32.5, hands: 1 });
  });

  it('lands a typed stack total on its pin and is nothing for an empty field', () => {
    const total = { mode: 'total' } as const;
    expect(
      deriveLoad({
        mode: total,
        value: 40,
        unit: 'kg',
        setting: machine,
        current: null,
        unilateral: false,
      }),
    ).toEqual({ ...machine, steps: 6 });
    expect(
      deriveLoad({
        mode: total,
        value: null,
        unit: 'kg',
        setting: machine,
        current: null,
        unilateral: false,
      }),
    ).toBeNull();
  });

  it('describes a plate-loaded machine without a bar, and a single post as 1×', () => {
    expect(describeLoad({ kind: 'barbell', barKg: 0, platesKg: [20, 20] }, 'kg').parts).toBe(
      '2×(20×2)',
    );
    expect(
      describeLoad({ kind: 'barbell', barKg: 0, platesKg: [20, 20], sides: 1 }, 'kg').parts,
    ).toBe('1×(20×2)');
  });

  it('reads a single-post machine as its own kind and caps a typed number', () => {
    expect(machineLoadKind(POST_MACHINE_SEED)).toBe('post');
    expect(rowInputMode({ equipment: 'machine' }, POST_MACHINE_SEED)).toEqual({
      mode: 'perSide',
      baseKg: 0,
      sides: 1,
    });
    expect(
      deriveLoad({
        mode: { mode: 'perSide', baseKg: 0, sides: 1 },
        value: 35,
        unit: 'kg',
        setting: null,
        current: null,
        unilateral: false,
      }),
    ).toEqual({ kind: 'barbell', barKg: 0, platesKg: [25, 10], sides: 1 });
    expect(clampInput('perSide', 9999, 'kg')).toBe(250);
    expect(clampInput('total', 400, 'lb')).toBe(400);
  });
});
