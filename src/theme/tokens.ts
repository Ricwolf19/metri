/**
 * Theme tokens as space-separated RGB channels (so Tailwind's `<alpha-value>`
 * opacity modifiers work, e.g. `bg-ink-800/60`). `tailwind.config.js` maps the
 * `ink.*` / `accent` colors to `rgb(var(--ink-x) / <alpha-value>)`, and the
 * ThemeProvider swaps these values per scheme via NativeWind's `vars()`.
 *
 * `ink-950` is intentionally NOT themed (kept constant near-black in
 * `tailwind.config.js`): it's only ever used as dark text ON the lime accent
 * (buttons, result card, segmented control), which must stay dark in both modes.
 *
 * The DARK values mirror the original palette exactly, so dark mode is unchanged.
 */
export type ThemeScheme = 'light' | 'dark';

export const THEME_VARS: Record<ThemeScheme, Record<string, string>> = {
  dark: {
    '--ink-900': '11 13 18', // app background
    '--ink-850': '15 18 25',
    '--ink-800': '20 24 35', // cards / surfaces
    '--ink-750': '26 31 43',
    '--ink-700': '33 39 55', // raised surfaces
    '--ink-600': '44 52 71', // borders
    '--ink-500': '59 68 89',
    '--ink-400': '86 96 119', // muted text
    '--ink-300': '124 134 156', // secondary text
    '--ink-200': '170 178 196',
    '--ink-100': '215 220 230',
    '--ink-50': '238 241 246', // primary text
    '--accent': '190 248 43', // lime-400 — accent text on dark
    '--accent-fill': '190 248 43', // lime-400 — button/CTA fills on dark
  },
  light: {
    '--ink-900': '247 249 252', // app background (near-white)
    '--ink-850': '244 247 250',
    '--ink-800': '255 255 255', // cards (white)
    '--ink-750': '237 240 245',
    '--ink-700': '226 231 240', // raised surfaces
    '--ink-600': '209 214 224', // borders
    '--ink-500': '170 178 196',
    '--ink-400': '120 130 150', // muted text
    '--ink-300': '90 99 120', // secondary text
    '--ink-200': '60 70 90',
    '--ink-100': '34 40 52',
    '--ink-50': '17 20 27', // primary text (near-black)
    '--accent': '101 163 13', // lime-700 — accent text on light
    '--accent-fill': '132 204 22', // lime-600 — calmer green for fills on white
  },
};

/** React Navigation theme colors per scheme (used for the native nav shell). */
export const NAV_COLORS: Record<
  ThemeScheme,
  { background: string; card: string; text: string; border: string }
> = {
  dark: { background: '#0b0d12', card: '#0b0d12', text: '#eef1f6', border: '#2c3447' },
  light: { background: '#f7f9fc', card: '#ffffff', text: '#11141b', border: '#d1d6e0' },
};
