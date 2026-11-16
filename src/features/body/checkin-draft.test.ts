import { describe, expect, it } from 'vitest';

import { checkinChanges, normalizeCheckin, parseReading } from './checkin-draft';

const SITES = ['waist', 'neck', 'hips'] as const;
const sites = [...SITES];

describe('check-in draft', () => {
  it('reads a comma as a decimal point and ignores what is not a reading', () => {
    expect(parseReading('80,5')).toBe(80.5);
    expect(parseReading('')).toBeNull();
    expect(parseReading('0')).toBeNull();
    expect(parseReading('abc')).toBeNull();
  });

  it('writes nothing for a day saved again untouched', () => {
    const loaded = { weight: '176.4', sites: { waist: '33.1', neck: '15' } };
    expect(checkinChanges(loaded, structuredClone(loaded), sites)).toEqual({
      weight: null,
      tape: {},
    });
  });

  it('treats the same number spelled differently as no change', () => {
    const loaded = { weight: '80', sites: { waist: '85' } };
    const typed = { weight: '80,0', sites: { waist: '85.0' } };
    expect(checkinChanges(loaded, typed, sites)).toEqual({ weight: null, tape: {} });
    expect(normalizeCheckin(typed, sites)).toEqual(normalizeCheckin(loaded, sites));
  });

  it('writes only the fields that changed', () => {
    const loaded = { weight: '80', sites: { waist: '85', neck: '38' } };
    const typed = { weight: '80', sites: { waist: '84.5', neck: '38', hips: '99' } };
    expect(checkinChanges(loaded, typed, sites)).toEqual({
      weight: null,
      tape: { waist: 84.5, hips: 99 },
    });
  });

  it('clears an emptied site but never an emptied weight', () => {
    const loaded = { weight: '80', sites: { waist: '85' } };
    const typed = { weight: '', sites: { waist: '' } };
    expect(checkinChanges(loaded, typed, sites)).toEqual({ weight: null, tape: { waist: null } });
  });

  it('writes a new weight', () => {
    expect(checkinChanges({ weight: '', sites: {} }, { weight: '79.6', sites: {} }, sites)).toEqual(
      { weight: 79.6, tape: {} },
    );
  });
});
