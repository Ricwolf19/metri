/**
 * The printed page's colours. A PDF is paper — always light, never a themed
 * surface — so, like the share card's palette, these are plain hex and live
 * only here. They follow metri.info's print stylesheet (`@media print` in its
 * `globals.css`): ink on white, #ddd rules, #555 muted copy. The lime is
 * darkened for text and lines, since the screen lime vanishes on white.
 */
export const PRINT = {
  ink: '#111111',
  muted: '#555555',
  faint: '#8a8a8a',
  rule: '#dddddd',
  paper: '#ffffff',
  tint: '#f6f8ef',
  /** Lines and the "on target" fill — lime that survives a printer. */
  brand: '#65a30d',
  /** Accent text (the eyebrow, the key tape site). */
  brandText: '#3f6212',
  under: '#d97706',
  over: '#dc2626',
  untrained: '#e4e4e7',
  outline: '#a1a1aa',
  dot: '#9ca3af',
} as const;
