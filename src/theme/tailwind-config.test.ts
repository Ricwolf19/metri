/// <reference types="node" />
import { createRequire } from 'node:module';

import resolveConfig from 'tailwindcss/resolveConfig';
import { describe, expect, it } from 'vitest';

const load = createRequire(import.meta.url);

/** The app's config resolved as NativeWind compiles it: its preset, then our extensions. */
const theme = resolveConfig(load('../../tailwind.config.js')).theme as unknown as Record<
  string,
  Record<string, unknown>
>;

/** Every scale built on `spacing` that sizes or spaces a control. */
const SCALES = [
  'spacing',
  'height',
  'width',
  'size',
  'minHeight',
  'minWidth',
  'maxWidth',
  'padding',
  'margin',
  'gap',
  'inset',
];

describe('tailwind spacing', () => {
  // NativeWind's rem is 14 dp, so the stock 2.75rem `11` is 38.5 dp: a "44 dp"
  // `min-h-11` fell short of the touch floor everywhere it was written.
  it('pins the control steps to exact dp in every scale built on spacing', () => {
    for (const scale of SCALES) {
      const { 10: ten, 11: eleven, 12: twelve } = theme[scale];
      expect({ scale, ten, eleven, twelve }).toEqual({
        scale,
        ten: '40px',
        eleven: '44px',
        twelve: '48px',
      });
    }
  });

  it('leaves the other steps on rem', () => {
    expect(theme.spacing[9]).toBe('2.25rem');
    expect(theme.spacing[14]).toBe('3.5rem');
  });
});
