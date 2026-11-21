import { describe, expect, it } from 'vitest';

import { tokenRgba } from '@/theme/tokens';

import { FADE_SIZE, fadeStyle, hiddenEnds } from './edge-fade';

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

describe('fadeStyle', () => {
  it('melts into the declared surface, opaque at the edge and clear inwards', () => {
    const g = gradientOf(fadeStyle('raised', 'right'));
    expect(g.type).toBe('linear-gradient');
    expect(g.direction).toBe('to left');
    expect(g.colorStops[0].color).toBe(tokenRgba('--ink-800', 1));
    expect(g.colorStops.at(-1)?.color).toBe(tokenRgba('--ink-800', 0));
  });

  it('holds a solid band at the edge before thinning, so the clip never shows', () => {
    // Opaque at 0 % only, a row cut at the edge still read through and its
    // clip drew a hard line across the text.
    const stops = gradientOf(fadeStyle('base', 'bottom')).colorStops;
    expect(stops[0]).toEqual({ color: tokenRgba('--ink-900', 1), positions: ['0%'] });
    expect(stops[1]).toEqual({ color: tokenRgba('--ink-900', 1), positions: ['35%'] });
    expect(stops.at(-1)?.color).toBe(tokenRgba('--ink-900', 0));
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
