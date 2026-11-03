import { describe, expect, it } from 'vitest';

import { loadTotalKg, type LoadDetail } from './load';
import { oneDumbbellFill, seedRow } from './row-seed';

const BAR: LoadDetail = { kind: 'barbell', barKg: 20, platesKg: [20, 10] };

describe("seedRow — a new session opens on last time's picture", () => {
  it('a bar reopens on the same plates, side and total following them', () => {
    const draft = seedRow({
      fill: { weightKg: 80, reps: 8, load: BAR },
      mode: { mode: 'perSide', baseKg: 20, sides: 2 },
      unit: 'kg',
      setting: null,
      unilateral: false,
    });
    expect(draft).toMatchObject({ side: '30', weight: '80', reps: '8', load: BAR });
  });

  it('a set logged without plates still opens with a picture of its total', () => {
    const draft = seedRow({
      fill: { weightKg: 80, reps: 8, load: null },
      mode: { mode: 'perSide', baseKg: 20, sides: 2 },
      unit: 'kg',
      setting: null,
      unilateral: false,
    });
    expect(draft.weight).toBe('80');
    expect(draft.load?.kind).toBe('barbell');
    expect(loadTotalKg(draft.load!)).toBe(80);
  });

  it('a one-post machine keeps its single post', () => {
    const post: LoadDetail = { kind: 'barbell', barKg: 0, platesKg: [20, 1.25], sides: 1 };
    const draft = seedRow({
      fill: { weightKg: 21.25, reps: 10, load: post },
      mode: { mode: 'perSide', baseKg: 0, sides: 1 },
      unit: 'kg',
      setting: post,
      unilateral: false,
    });
    expect(draft).toMatchObject({ weight: '21.25', load: { sides: 1, platesKg: [20, 1.25] } });
  });

  it('a stack total lands on its pin when the set carried none', () => {
    const stack: LoadDetail = { kind: 'machine', baseKg: 10, incrementKg: 5, steps: 0 };
    const draft = seedRow({
      fill: { weightKg: 40, reps: 12, load: null },
      mode: { mode: 'total' },
      unit: 'kg',
      setting: stack,
      unilateral: false,
    });
    expect(draft.load).toEqual({ ...stack, steps: 6 });
  });

  it('dumbbells keep the hands they were lifted with', () => {
    const pair: LoadDetail = { kind: 'dumbbell', perHandKg: 22.5, hands: 2 };
    const draft = seedRow({
      fill: { weightKg: 22.5, reps: 10, load: pair },
      mode: { mode: 'perHand' },
      unit: 'kg',
      setting: null,
      unilateral: false,
    });
    expect(draft).toMatchObject({ weight: '22.5', load: pair });
  });

  it('a lb gym reads the kg plates back as its own rack', () => {
    const lbBar: LoadDetail = { kind: 'barbell', barKg: 20.41, platesKg: [20.41] };
    const draft = seedRow({
      fill: { weightKg: 61.23, reps: 5, load: lbBar },
      mode: { mode: 'perSide', baseKg: 20.41, sides: 2 },
      unit: 'lb',
      setting: lbBar,
      unilateral: false,
    });
    expect(draft).toMatchObject({ side: '45', weight: '135' });
  });

  it("nothing to go on opens an empty number with the plan's reps", () => {
    const draft = seedRow({
      fill: { weightKg: null, reps: 8, load: null },
      mode: { mode: 'perSide', baseKg: 20, sides: 2 },
      unit: 'kg',
      setting: null,
      unilateral: false,
    });
    expect(draft).toMatchObject({ weight: '', reps: '8', load: null });
  });
});

describe('oneDumbbellFill', () => {
  it('reopens a single-dumbbell lift on one dumbbell, whatever an older set said', () => {
    const pair: LoadDetail = { kind: 'dumbbell', perHandKg: 20, hands: 2 };
    expect(oneDumbbellFill({ weightKg: 20, reps: 10, load: pair }).load).toEqual({
      ...pair,
      hands: 1,
    });
    expect(oneDumbbellFill({ weightKg: 20, reps: 10, load: null }).load).toBeNull();
  });
});
