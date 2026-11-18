import type { Locale } from '@/i18n';
import { fold } from '@/lib/text';

/**
 * The session strip's short names: a chip per exercise has to fit five or six
 * across a phone, and "Press francés sentado con barra" alone filled it. Tapping
 * a chip shows the full name; screen readers always get the full name. Content,
 * like `EXERCISE_NAMES` (same ids, both languages); a custom exercise gets
 * `abbreviateName` instead. Keep each under `SHORT_NAME_MAX` characters.
 */
export const SHORT_NAME_MAX = 16;

export const EXERCISE_SHORT_NAMES: Record<string, Record<Locale, string>> = {
  'barbell-back-squat': { en: 'Squat', es: 'Sentadilla' },
  'barbell-bench-press': { en: 'Bench', es: 'Banca' },
  'incline-bench-press': { en: 'Incline Bench', es: 'Banca incl.' },
  'close-grip-bench-press': { en: 'CG Bench', es: 'Banca cerrada' },
  deadlift: { en: 'Deadlift', es: 'Peso muerto' },
  'sumo-deadlift': { en: 'Sumo DL', es: 'PM sumo' },
  'romanian-deadlift': { en: 'RDL', es: 'Rumano' },
  'overhead-press': { en: 'OHP', es: 'Militar' },
  'seated-barbell-press': { en: 'Seated OHP', es: 'Militar sent.' },
  'seated-dumbbell-press': { en: 'DB OHP', es: 'Militar manc.' },
  'lat-pulldown': { en: 'Pulldown', es: 'Jalón' },
  'supinated-lat-pulldown': { en: 'UH Pulldown', es: 'Jalón supino' },
  'close-grip-lat-pulldown': { en: 'CG Pulldown', es: 'Jalón estrecho' },
  'wide-grip-lat-pulldown': { en: 'WG Pulldown', es: 'Jalón ancho' },
  'leg-press': { en: 'Leg Press', es: 'Prensa' },
  'leg-extension': { en: 'Leg Ext', es: 'Ext. cuádriceps' },
  'lying-leg-curl': { en: 'Leg Curl', es: 'Femoral' },
  'standing-leg-curl': { en: 'SL Leg Curl', es: 'Femoral de pie' },
  'barbell-curl': { en: 'BB Curl', es: 'Curl barra' },
  'hammer-curl': { en: 'Hammer', es: 'Martillo' },
  'cable-hammer-curl': { en: 'Cable Hammer', es: 'Martillo polea' },
  skullcrusher: { en: 'DB Skull', es: 'Francés tumb.' },
  'barbell-skullcrusher': { en: 'BB Skull', es: 'Francés barra' },
  'back-extension': { en: 'Hyperext', es: 'Hiperext.' },
  crunch: { en: 'Crunch', es: 'Crunch' },
  'cable-crunch': { en: 'Cable Crunch', es: 'Crunch polea' },
  'decline-sit-up': { en: 'Decline Sit-Up', es: 'Abs declinado' },
  'machine-crunch': { en: 'Mach. Crunch', es: 'Crunch máq.' },
  'standing-calf-raise': { en: 'Calves', es: 'Gemelos' },
  'machine-chest-press': { en: 'Chest Press', es: 'Chest press' },
  'dumbbell-fly': { en: 'DB Fly', es: 'Aperturas' },
  'cable-fly': { en: 'Cable Fly', es: 'Apert. polea' },
  'machine-fly': { en: 'Pec Deck', es: 'Contractora' },
  'lateral-raise': { en: 'Lateral', es: 'Laterales' },
  'cable-lateral-raise': { en: 'Cable Lateral', es: 'Lat. polea' },
  'rear-delt-fly': { en: 'Rear Delt', es: 'Posterior' },
  'machine-rear-delt-fly': { en: 'Rev. Pec Deck', es: 'Posterior máq.' },
  'machine-shoulder-press': { en: 'Mach. OHP', es: 'Militar máq.' },
  pullover: { en: 'DB Pullover', es: 'Pullover' },
  'cable-pullover': { en: 'Cable Pullover', es: 'Pullover polea' },
  'machine-row': { en: 'Mach. Row', es: 'Remo máq.' },
  'dumbbell-row': { en: 'DB Row', es: 'Remo manc.' },
  'seated-cable-row': { en: 'Cable Row', es: 'Gironda' },
  't-bar-row': { en: 'T-Bar', es: 'Remo T' },
  'hack-squat': { en: 'Hack', es: 'Hack' },
  'bulgarian-split-squat': { en: 'BSS', es: 'Búlgara' },
  'preacher-curl': { en: 'Preacher', es: 'Scott' },
  'spider-curl': { en: 'DB Spider', es: 'Spider manc.' },
  'barbell-spider-curl': { en: 'BB Spider', es: 'Spider barra' },
  'incline-dumbbell-curl': { en: 'Incline Curl', es: 'Curl incl.' },
  'tricep-pushdown': { en: 'Pushdown', es: 'Tríceps polea' },
  'overhead-tricep-extension': { en: 'DB French', es: 'Francés sent.' },
  'cable-overhead-extension': { en: 'Cable OH Ext', es: 'Tras nuca polea' },
  'french-press': { en: 'BB French', es: 'Fr. sent. barra' },
  'cable-kickback': { en: 'Cable Kickback', es: 'Kickback polea' },
  'dumbbell-bench-press': { en: 'DB Bench', es: 'Banca manc.' },
  'smith-machine-bench-press': { en: 'Smith Bench', es: 'Banca Smith' },
  'incline-dumbbell-press': { en: 'Incline DB', es: 'Incl. manc.' },
  'goblet-squat': { en: 'Goblet', es: 'Goblet' },
  'smith-machine-squat': { en: 'Smith Squat', es: 'Sent. Smith' },
  'walking-lunge': { en: 'Walking Lunge', es: 'Desplantes' },
  'reverse-lunge': { en: 'Rev. Lunge', es: 'Desplante atrás' },
  'barbell-row': { en: 'BB Row', es: 'Remo barra' },
  'chest-supported-row': { en: 'CS DB Row', es: 'Remo apoyado' },
  'pull-up': { en: 'Pull-Up', es: 'Dominadas' },
  'assisted-pull-up': { en: 'Asst. Pull-Up', es: 'Dom. asistidas' },
  'dumbbell-romanian-deadlift': { en: 'DB RDL', es: 'Rumano manc.' },
  'hip-thrust': { en: 'Hip Thrust', es: 'Hip thrust' },
  'dumbbell-curl': { en: 'DB Curl', es: 'Curl manc.' },
  'cable-curl': { en: 'Cable Curl', es: 'Curl polea' },
  'machine-preacher-curl': { en: 'Mach. Preacher', es: 'Scott máq.' },
  'dumbbell-kickback': { en: 'DB Kickback', es: 'Kickback manc.' },
  'machine-lateral-raise': { en: 'Mach. Lateral', es: 'Lat. máq.' },
  'seated-calf-raise': { en: 'Seated Calves', es: 'Gemelos sent.' },
  'single-leg-calf-raise': { en: 'SL Calves', es: 'Gemelo unilat.' },
};

/** Filler words a short name can drop, both languages. */
const STOPWORDS = new Set([
  'de',
  'del',
  'con',
  'en',
  'la',
  'el',
  'al',
  'a',
  'y',
  'with',
  'the',
  'on',
  'of',
  'and',
]);

/** The usual gym shorthand, keyed by the folded word ("Extensión" → "extension"). */
const WORD_SHORT: Record<string, string> = {
  barbell: 'BB',
  dumbbell: 'DB',
  dumbbells: 'DB',
  machine: 'Mach.',
  incline: 'Incl.',
  decline: 'Decl.',
  extension: 'Ext.',
  mancuerna: 'manc.',
  mancuernas: 'manc.',
  maquina: 'máq.',
  inclinado: 'incl.',
  inclinada: 'incl.',
  declinado: 'decl.',
  sentado: 'sent.',
  sentada: 'sent.',
  agarre: '',
};

/**
 * A short name for an exercise the catalog does not know (a custom one): the
 * name itself when it already fits, else its words with the filler dropped and
 * the gym shorthand applied, as many of them from the start as fit (two at
 * least — the full name is one tap away).
 */
export const abbreviateName = (name: string): string => {
  const trimmed = name.trim();
  if (trimmed.length <= SHORT_NAME_MAX) return trimmed;
  const words = trimmed
    .split(/\s+/)
    .filter((w) => !STOPWORDS.has(fold(w)))
    .map((w) => WORD_SHORT[fold(w)] ?? w)
    .filter(Boolean);
  let short = words.slice(0, 2).join(' ');
  for (const w of words.slice(2)) {
    if (short.length + 1 + w.length > SHORT_NAME_MAX) break;
    short = `${short} ${w}`;
  }
  return short;
};
