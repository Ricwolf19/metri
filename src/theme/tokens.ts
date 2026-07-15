/**
 * Theme tokens as space-separated RGB channels (so Tailwind's `<alpha-value>`
 * opacity modifiers work, e.g. `bg-ink-800/60`). `tailwind.config.js` maps the
 * `ink.*` / `accent` / `brand` colors to `rgb(var(--x) / <alpha-value>)`, and the
 * ThemeProvider swaps these values per scheme via NativeWind's `vars()`.
 *
 * Values mirror metri.info's neutral "zinc" ink scale + lime brand (its
 * globals.css) so mobile and web share one design system.
 *
 * `ink-950` is intentionally NOT themed (kept constant near-black in
 * `tailwind.config.js`). `--accent*` are kept as lime for now (legacy alias of
 * `--brand`); screens migrate `accent`→`brand` in the UI refactor.
 */
export type ThemeScheme = 'light' | 'dark';

export const THEME_VARS: Record<ThemeScheme, Record<string, string>> = {
  dark: {
    '--ink-900': '9 9 11', // app background
    '--ink-850': '13 13 16',
    '--ink-800': '18 18 21', // cards / surfaces
    '--ink-750': '24 24 27',
    '--ink-700': '32 32 36', // raised surfaces
    '--ink-600': '42 42 47', // borders
    '--ink-500': '63 63 70',
    '--ink-400': '113 113 122', // muted text
    '--ink-300': '161 161 170', // secondary text
    '--ink-200': '212 212 216',
    '--ink-100': '228 228 231',
    '--ink-50': '245 245 247', // primary text
    '--accent': '190 248 43', // lime-400 — accent text on dark
    '--accent-fill': '190 248 43', // lime-400 — button/CTA fills on dark
    '--brand': '190 248 43', // lime-400 — CTA / active
    '--brand-contrast': '8 9 13', // ink-950 — text on brand fills
  },
  light: {
    '--ink-900': '250 250 250', // app background (near-white)
    '--ink-850': '245 245 246',
    '--ink-800': '255 255 255', // cards (white)
    '--ink-750': '244 244 245',
    '--ink-700': '235 235 238', // raised surfaces
    '--ink-600': '214 214 219', // borders
    '--ink-500': '161 161 170',
    '--ink-400': '113 113 122', // muted text
    '--ink-300': '82 82 91', // secondary text
    '--ink-200': '52 52 56',
    '--ink-100': '39 39 42',
    '--ink-50': '24 24 27', // primary text (near-black)
    '--accent': '101 163 13', // lime-700 — accent text on light
    '--accent-fill': '132 204 22', // lime-600 — calmer green for fills on white
    '--brand': '77 124 15', // lime-800 — CTA / active on light
    '--brand-contrast': '247 254 231', // lime-50 — text on brand fills
  },
};

/** React Navigation theme colors per scheme (used for the native nav shell). */
export const NAV_COLORS: Record<
  ThemeScheme,
  { background: string; card: string; text: string; border: string }
> = {
  dark: { background: '#09090b', card: '#09090b', text: '#f5f5f7', border: '#2a2a2f' },
  light: { background: '#fafafa', card: '#ffffff', text: '#18181b', border: '#d6d6db' },
};
