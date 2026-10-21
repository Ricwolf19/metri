import type { Locale } from '@/i18n';
import { fold } from '@/lib/text';

/**
 * The preset cues ("Pausa 1s", "Agarre supino") are stored as plain strings on
 * template slots, enrolled copies and session snapshots, in whatever language
 * the seed was written in. The copy is resolved at render instead, so an EN
 * app never shows "Pausa" and an old enrollment follows a language switch. A
 * cue the lifter typed themselves is not in the table and renders as typed.
 */
type Pair = Record<Locale, string> & {
  /** What the cue asks of the rep, spelled out — the pauses the Progression
   * presets prescribe are technique, and a two-word pill was forgotten mid-set. */
  detail?: Record<Locale, string>;
};

const COPY: Pair[] = [
  {
    es: 'Pausa',
    en: 'Pause',
    detail: { es: 'Detente abajo, luego empuja', en: 'Stop dead at the bottom, then drive' },
  },
  {
    es: 'Pausa 1s',
    en: '1 s pause',
    detail: { es: 'Aguanta 1 s abajo antes de subir', en: 'Hold the bottom 1 s before pushing' },
  },
  {
    es: 'Pausa 2s',
    en: '2 s pause',
    detail: { es: 'Aguanta 2 s abajo antes de subir', en: 'Hold the bottom 2 s before pushing' },
  },
  { es: 'Agarre supino', en: 'Supinated grip' },
  { es: 'Agarre prono', en: 'Pronated grip' },
  { es: 'Agarre estrecho', en: 'Close grip' },
  { es: 'Agarre ancho', en: 'Wide grip' },
  { es: 'Mancuernas', en: 'Dumbbells' },
  { es: 'Polea', en: 'Cable' },
  { es: 'Similar al dibujo', en: 'As pictured' },
];

/** Either language's spelling finds the pair, so stored EN and ES cues both resolve. */
const INDEX: ReadonlyMap<string, Pair> = new Map(
  COPY.flatMap((pair) => [
    [fold(pair.es), pair],
    [fold(pair.en), pair],
  ]),
);

export const badgeLabel = (badge: string, locale: Locale): string =>
  INDEX.get(fold(badge.trim()))?.[locale] ?? badge;

/** The technique a cue stands for, when it is one worth spelling out; null for a plain tag. */
export const badgeDetail = (badge: string, locale: Locale): string | null =>
  INDEX.get(fold(badge.trim()))?.detail?.[locale] ?? null;
