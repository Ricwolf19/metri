import type { Locale } from '@/i18n';
import { fold } from '@/lib/text';

/**
 * The preset cues ("Pausa 1s", "Agarre supino") are stored as plain strings on
 * template slots, enrolled copies and session snapshots, in whatever language
 * the seed was written in. The copy is resolved at render instead, so an EN
 * app never shows "Pausa" and an old enrollment follows a language switch. A
 * cue the lifter typed themselves is not in the table and renders as typed.
 */
const COPY: Record<Locale, string>[] = [
  { es: 'Pausa', en: 'Pause' },
  { es: 'Pausa 1s', en: '1 s pause' },
  { es: 'Pausa 2s', en: '2 s pause' },
  { es: 'Agarre supino', en: 'Supinated grip' },
  { es: 'Agarre prono', en: 'Pronated grip' },
  { es: 'Agarre estrecho', en: 'Close grip' },
  { es: 'Agarre ancho', en: 'Wide grip' },
  { es: 'Mancuernas', en: 'Dumbbells' },
  { es: 'Polea', en: 'Cable' },
  { es: 'Similar al dibujo', en: 'As pictured' },
];

/** Either language's spelling finds the pair, so stored EN and ES cues both resolve. */
const INDEX: ReadonlyMap<string, Record<Locale, string>> = new Map(
  COPY.flatMap((pair) => [
    [fold(pair.es), pair],
    [fold(pair.en), pair],
  ]),
);

export const badgeLabel = (badge: string, locale: Locale): string =>
  INDEX.get(fold(badge.trim()))?.[locale] ?? badge;
