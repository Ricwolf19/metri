import { beforeEach, describe, expect, it, vi } from 'vitest';

import { addRackExtra, dumbbellRack, removeRackExtra, saveRackLadder } from './dumbbell-rack';
import { parseLadder, stepAlong } from './ladder';
import { rackWeights } from './load';
import { DEFAULT_DUMBBELL_RACK } from './plate-math';

// MMKV holds JSON: the round trip keeps the tests off object identity.
const racks = new Map<string, string>();
vi.mock('@/lib/storage', () => ({
  settings: {
    getDumbbellRack: (unit: string) => {
      const raw = racks.get(unit);
      return raw ? JSON.parse(raw) : null;
    },
    setDumbbellRack: (unit: string, rack: unknown) => racks.set(unit, JSON.stringify(rack)),
  },
}));

const stored = (unit: string): unknown => JSON.parse(racks.get(unit) ?? 'null');

describe('the dumbbell rack', () => {
  beforeEach(() => racks.clear());

  it('is the default until described', () => {
    expect(dumbbellRack('kg')).toEqual(DEFAULT_DUMBBELL_RACK.kg);
  });

  it('keeps an odd dumbbell beside the default steps without freezing them', () => {
    expect(addRackExtra('lb', 12)).toEqual([12]);
    expect(dumbbellRack('lb')).toEqual({ ...DEFAULT_DUMBBELL_RACK.lb, extras: [12] });
    // Only the extra is written: the ladder stays the build's default.
    expect(stored('lb')).toEqual({ extras: [12] });
    // An older build reads no ladder there and falls back to its default rack.
    expect(parseLadder(stored('lb'))).toBeNull();
  });

  it('keeps the extras when the steps are edited, and the steps when an extra goes', () => {
    addRackExtra('lb', 12);
    addRackExtra('lb', 17.5);
    saveRackLadder('lb', { start: 10, step: 10 });
    expect(dumbbellRack('lb')).toEqual({ start: 10, step: 10, jumps: [], extras: [12, 17.5] });
    // An older build still reads the ladder it knows and ignores the extra key.
    expect(parseLadder(stored('lb'))).toEqual({ start: 10, step: 10, jumps: [] });
    expect(removeRackExtra('lb', 12)).toEqual([17.5]);
    expect(dumbbellRack('lb')).toEqual({ start: 10, step: 10, jumps: [], extras: [17.5] });
    removeRackExtra('lb', 17.5);
    expect(dumbbellRack('lb')).toEqual({ start: 10, step: 10, jumps: [] });
  });

  it('adds a dumbbell once, lightest first, and reads past a value it cannot use', () => {
    addRackExtra('kg', 9);
    addRackExtra('kg', 3);
    expect(addRackExtra('kg', 9)).toEqual([3, 9]);
    racks.set('kg', JSON.stringify({ start: 2, step: 2, extras: [11, 'x', -1, null, 11, 7] }));
    expect(dumbbellRack('kg').extras).toEqual([7, 11]);
    racks.set('kg', JSON.stringify({ start: 2, step: 2, extras: 'many' }));
    expect(dumbbellRack('kg')).toEqual({ start: 2, step: 2, jumps: [] });
  });

  // The session row's ± walks `rackWeights(dumbbellRack(unit), unit)`, the
  // same list the sheet's grid draws: an odd dumbbell is a stop either way.
  it('gives the row ± the odd dumbbell as a stop of its own', () => {
    addRackExtra('lb', 12);
    const weights = rackWeights(dumbbellRack('lb'), 'lb');
    expect(weights.slice(0, 5)).toEqual([5, 10, 12, 15, 20]);
    expect(stepAlong(weights, 10, 2.5)).toBe(12);
    expect(stepAlong(weights, 12, -5)).toBe(10);
    expect(stepAlong(weights, 12, 5)).toBe(15);
  });
});
