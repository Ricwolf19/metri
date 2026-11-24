import { describe, expect, it } from 'vitest';

import { tokenRgba } from '@/theme/tokens';

import { FADE_SIZE, fadeStyle, hiddenEnds } from './edge-fade';
import { SHEET_GUTTER } from './gutter';

describe('hiddenEnds', () => {
  it('fades nothing before both sizes are measured', () => {
    expect(hiddenEnds(0, 400, 0, 12)).toEqual({ start: false, end: false });
    expect(hiddenEnds(300, 0, 0, 12)).toEqual({ start: false, end: false });
  });

  it('fades nothing when the content fits', () => {
    expect(hiddenEnds(300, 300, 0, 12)).toEqual({ start: false, end: false });
    expect(hiddenEnds(300, 300.5, 0, 12)).toEqual({ start: false, end: false });
  });

  it('fades the far end at the start, both in the middle, the near end at the end', () => {
    expect(hiddenEnds(300, 600, 0, 12)).toEqual({ start: false, end: true });
    expect(hiddenEnds(300, 600, 150, 12)).toEqual({ start: true, end: true });
    expect(hiddenEnds(300, 600, 300, 12)).toEqual({ start: true, end: false });
  });

  it('ignores unreached scroll within the slack', () => {
    expect(hiddenEnds(300, 600, 12, 12).start).toBe(false);
    expect(hiddenEnds(300, 600, 13, 12).start).toBe(true);
    expect(hiddenEnds(300, 600, 288, 12).end).toBe(false);
    expect(hiddenEnds(300, 600, 287, 12).end).toBe(true);
  });
});

type Gradient = {
  type: string;
  direction: string;
  colorStops: { color: string; positions: string[] }[];
};

const gradientOf = (style: ReturnType<typeof fadeStyle>): Gradient =>
  (style.experimental_backgroundImage as Gradient[])[0];

/** The gradient as (share of the depth, opacity) points, edge first. */
const curveOf = (style: ReturnType<typeof fadeStyle>): { at: number; alpha: number }[] =>
  gradientOf(style).colorStops.map((s) => ({
    at: parseFloat(s.positions[0]) / 100,
    alpha: Number(/,([\d.]+)\)$/.exec(s.color)?.[1]),
  }));

/** The opacity drawn at `t`: the platform runs a straight line between stops. */
const alphaAt = (curve: { at: number; alpha: number }[], t: number): number => {
  const next = curve.findIndex((p) => p.at >= t);
  const a = curve[next - 1];
  const b = curve[next];
  return a.alpha + ((b.alpha - a.alpha) * (t - a.at)) / (b.at - a.at);
};

describe('fadeStyle', () => {
  it('melts into the declared surface, opaque at the edge and clear inwards', () => {
    const g = gradientOf(fadeStyle('raised', 'right'));
    expect(g.type).toBe('linear-gradient');
    expect(g.direction).toBe('to left');
    expect(g.colorStops[0].color).toBe(tokenRgba('--ink-800', 1));
    expect(g.colorStops.at(-1)?.color).toBe(tokenRgba('--ink-800', 0));
  });

  it('stays near-opaque through the first 15 %, so a cut at the clip never shows', () => {
    // Opaque at 0 % only, a row cut at the edge still read through and its
    // clip drew a hard line across the text.
    const curve = curveOf(fadeStyle('base', 'bottom'));
    expect(curve[0]).toEqual({ at: 0, alpha: 1 });
    expect(alphaAt(curve, 0.15)).toBeGreaterThan(0.9);
    expect(curve.at(-1)).toEqual({ at: 1, alpha: 0 });
  });

  it('only ever thins, easing out with no kink a second edge could read in', () => {
    // The solid band it replaced held 1 to 35 % and then dropped: the eye read
    // that corner as an edge of its own.
    const curve = curveOf(fadeStyle('raised', 'left'));
    expect(curve.length).toBeGreaterThanOrEqual(6);
    const slopes = curve.slice(1).map((p, i) => (curve[i].alpha - p.alpha) / (p.at - curve[i].at));
    for (const slope of slopes) expect(slope).toBeGreaterThanOrEqual(0);
    for (let i = 1; i < slopes.length; i++) {
      expect(Math.abs(slopes[i] - slopes[i - 1])).toBeLessThan(0.75);
    }
    // Flat against both ends: no step at the edge, no line where it lands on clear.
    expect(slopes[0]).toBeLessThan(0.5);
    expect(slopes.at(-1)).toBeLessThan(0.5);
  });

  it('reads past the widest gutter a strip bleeds through', () => {
    expect(FADE_SIZE.row).toBeGreaterThan(SHEET_GUTTER + 8);
  });

  it('paints each surface in its own token', () => {
    expect(gradientOf(fadeStyle('base', 'left')).colorStops[0].color).toBe(
      tokenRgba('--ink-900', 1),
    );
    expect(gradientOf(fadeStyle('sunken', 'top')).colorStops[0].color).toBe(
      tokenRgba('--ink-850', 1),
    );
  });

  it('anchors to its own edge, sized for a row or an area', () => {
    expect(fadeStyle('base', 'left')).toMatchObject({
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: FADE_SIZE.row,
    });
    expect(fadeStyle('base', 'bottom')).toMatchObject({
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: FADE_SIZE.area,
    });
    expect(gradientOf(fadeStyle('base', 'top')).direction).toBe('to bottom');
    expect(gradientOf(fadeStyle('base', 'bottom')).direction).toBe('to top');
  });

  it('hands back the same object every time, so a re-render sends nothing new', () => {
    expect(fadeStyle('sunken', 'right')).toBe(fadeStyle('sunken', 'right'));
  });
});
