import { describe, expect, it } from 'vitest';

import { setRows } from './set-rows';

const rows = (planned: number, skipped: number[], working: string[], extra = 0) =>
  setRows({ planned, skipped: new Set(skipped), working, extra });

describe('setRows', () => {
  it('opens on set 1 and moves down as sets are logged', () => {
    expect(rows(3, [], []).live).toBe(0);
    const two = rows(3, [], ['s1', 's2']);
    expect(two.live).toBe(2);
    expect(two.model.map((r) => r.logged)).toEqual(['s1', 's2', null]);
  });

  it('a skipped row keeps its ordinal and the next set lands after it', () => {
    const r = rows(3, [1], ['s1']);
    expect(r.live).toBe(2);
    expect(r.model.map((x) => x.logged)).toEqual(['s1', null, null]);
    expect(rows(3, [1], ['s1', 's3']).live).toBeNull();
  });

  // Log set 1, skip set 2, then delete set 1: a count of settled rows (1)
  // pointed the live row at the SKIPPED ordinal, so nothing was live and the
  // card sat stuck until the skip was restored.
  it('deleting a set before a skipped one reopens the first free ordinal', () => {
    const r = rows(3, [1], []);
    expect(r.live).toBe(0);
    expect(r.model).toHaveLength(3);
  });

  it('extra rows open past the plan; past the plan with none open, nothing is live', () => {
    expect(rows(3, [], ['s1', 's2', 's3']).live).toBeNull();
    expect(rows(3, [], ['s1', 's2', 's3'], 1).live).toBe(3);
    const beyond = rows(3, [], ['s1', 's2', 's3', 's4']);
    expect(beyond.model).toHaveLength(4);
    expect(beyond.live).toBeNull();
    expect(rows(3, [], ['s1', 's2', 's3', 's4'], 1).live).toBe(4);
  });

  it('everything settled, logged or skipped, leaves no live row', () => {
    expect(rows(3, [0, 1, 2], []).live).toBeNull();
    expect(rows(2, [0], ['s2']).live).toBeNull();
  });
});
