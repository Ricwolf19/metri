/**
 * The share card's colours. A share card is an IMAGE — always dark, captured as
 * a PNG for the OS share sheet — so it does not follow the theme tokens, and
 * this file is the one place its hex lives (AGENTS.md lists it beside
 * `BarGraphic.tsx` as the hex exceptions). Twin of metri.info's OG card.
 */
export const SHARE = {
  bg: '#09090b',
  ink: '#fafafa',
  line: '#d4d4d8',
  muted: '#a1a1aa',
  dim: '#71717a',
  brand: '#bef82b',
  brandSoft: 'rgba(190,248,43,0.35)',
  glow: 'rgba(190,248,43,0.14)',
  tile: 'rgba(255,255,255,0.05)',
  tileBorder: 'rgba(255,255,255,0.08)',
} as const;
