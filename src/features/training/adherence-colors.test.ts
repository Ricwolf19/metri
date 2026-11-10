import { describe, expect, it } from 'vitest';

import {
  MISSED,
  adherenceCell,
  adherenceDot,
  adherenceMark,
  adherenceStatusKey,
} from './adherence-colors';

const theme = { brand: '#bef82b', brandContrast: '#08090d' };

describe('adherence colours', () => {
  it('paints trained as brand with the contrast text', () => {
    expect(adherenceCell(theme, { status: 'trained' })).toEqual({
      fill: '#bef82b',
      text: '#08090d',
      strike: false,
    });
  });

  it('paints missed red with near-black text, and strikes it through', () => {
    expect(adherenceCell(theme, { status: 'skipped' })).toEqual({
      fill: MISSED,
      text: '#08090d',
      strike: true,
    });
  });

  it('never tells trained from missed by colour alone', () => {
    const trained = adherenceCell(theme, { status: 'trained' });
    const missed = adherenceCell(theme, { status: 'skipped' });
    // Same near-black digits on both: the strike is the non-colour cue.
    expect(trained.text).toBe(missed.text);
    expect(trained.strike).not.toBe(missed.strike);
  });

  it('rings today until it is answered, with brand digits', () => {
    const today = adherenceCell(theme, { today: true });
    const past = adherenceCell(theme, {});
    expect(today.fill).toBe(past.fill);
    expect(today.text).toBe('#bef82b');
    expect(today.border).toBe('#bef82b');
    expect(past.border).toBeUndefined();
  });

  it('outlines rest, so it never reads as an unlogged day', () => {
    const rest = adherenceCell(theme, { status: 'rest' });
    const unlogged = adherenceCell(theme, {});
    expect(rest.border).toBeDefined();
    expect(unlogged.border).toBeUndefined();
  });

  it('paints another activity mid gray with near-black digits (brand read 3.28:1 there)', () => {
    const active = adherenceCell(theme, { status: 'active' });
    expect(active.text).toBe('#08090d');
    expect(active.fill).not.toBe(adherenceCell(theme, { status: 'rest' }).fill);
    expect(adherenceDot(theme, 'active')).not.toBe('transparent');
  });

  it('leaves future days bare and unlogged dots transparent', () => {
    expect(adherenceCell(theme, { future: true }).fill).toBe('transparent');
    expect(adherenceDot(theme, undefined)).toBe('transparent');
    expect(adherenceDot(theme, 'skipped')).toBe(MISSED);
  });
});

describe('adherence marks', () => {
  it('gives rest and missed their own shape beside the dots', () => {
    expect(adherenceMark('trained')).toBe('dot');
    expect(adherenceMark('active')).toBe('dot');
    expect(adherenceMark('rest')).toBe('ring');
    expect(adherenceMark('skipped')).toBe('cross');
    expect(adherenceMark(undefined)).toBe('none');
  });
});

describe('adherence status names', () => {
  it('names every answered day, an unanswered past day, and nothing for the days ahead', () => {
    expect(adherenceStatusKey('trained', false)).toBe('adherence.trained');
    expect(adherenceStatusKey('skipped', false)).toBe('adherence.skipped');
    expect(adherenceStatusKey('active', false)).toBe('adherence.active');
    expect(adherenceStatusKey('rest', false)).toBe('adherence.rest');
    expect(adherenceStatusKey(undefined, false)).toBe('adherence.unmarked');
    expect(adherenceStatusKey(undefined, true)).toBeNull();
  });
});
