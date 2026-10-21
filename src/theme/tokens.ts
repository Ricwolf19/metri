/**
 * Theme tokens as space-separated RGB channels (so Tailwind's `<alpha-value>`
 * opacity modifiers work, e.g. `bg-ink-800/60`). `tailwind.config.js` maps the
 * `ink.*` / `accent` / `brand` colors to `rgb(var(--x) / <alpha-value>)`, and the
 * ThemeProvider installs these values via NativeWind's `vars()`.
 *
 * Values mirror metri.info's neutral "zinc" ink scale + lime brand (its
 * globals.css) so mobile and web share one design system. The app is dark
 * only: the light scale and the system/light/dark picker were removed on
 * 2026-10-20 (`settings.theme` is a retired key), so there is ONE table.
 *
 * `ink-950` is intentionally NOT a variable (kept constant near-black in
 * `tailwind.config.js`). `--accent*` are kept as lime for now (legacy alias of
 * `--brand`); screens migrate `accent`→`brand` in the UI refactor.
 */
export const THEME_VARS: Record<string, string> = {
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
  '--accent': '190 248 43', // lime-400 — accent text
  '--accent-fill': '190 248 43', // lime-400 — button/CTA fills
  '--brand': '190 248 43', // lime-400 — CTA / active
  '--brand-contrast': '8 9 13', // ink-950 — text on brand fills
  '--info': '56 189 248', // sky-400 — informational, never "active"
};

/** React Navigation theme colors (used for the native nav shell). */
export const NAV_COLORS = {
  background: '#09090b',
  card: '#09090b',
  text: '#f5f5f7',
  border: '#2a2a2f',
} as const;
