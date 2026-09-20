import { EXERCISE_NAMES } from './exercise-content';

/**
 * Catalog exercises with bundled illustration frames
 * (`assets/exercises/<id>-{1..3}.png` — provenance in ATTRIBUTION.md there).
 * `pullover` and `french-press` ship without frames: the source library has
 * no matching movement, and a wrong-movement visual teaches worse than none.
 */
const VISUAL_IDS = [
  'barbell-back-squat',
  'barbell-bench-press',
  'incline-bench-press',
  'close-grip-bench-press',
  'deadlift',
  'sumo-deadlift',
  'romanian-deadlift',
  'overhead-press',
  'seated-dumbbell-press',
  'lat-pulldown',
  'leg-press',
  'leg-extension',
  'lying-leg-curl',
  'barbell-curl',
  'hammer-curl',
  'skullcrusher',
  'back-extension',
  'crunch',
  'standing-calf-raise',
  'machine-chest-press',
  'dumbbell-fly',
  'cable-fly',
  'lateral-raise',
  'cable-lateral-raise',
  'rear-delt-fly',
  'machine-shoulder-press',
  'machine-row',
  'dumbbell-row',
  'seated-cable-row',
  't-bar-row',
  'hack-squat',
  'bulgarian-split-squat',
  'preacher-curl',
  'spider-curl',
  'incline-dumbbell-curl',
  'tricep-pushdown',
  'overhead-tricep-extension',
  'cable-overhead-extension',
  'cable-kickback',
] as const;

export type VisualId = (typeof VISUAL_IDS)[number];

const VISUALS: ReadonlySet<string> = new Set(VISUAL_IDS);

/** "Curl Araña!" → "curl arana" — accent/symbol-insensitive comparison key. */
const normalize = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Normalized EN+ES catalog names → visual id, so customs can match by name.
const NAME_INDEX: ReadonlyMap<string, VisualId> = (() => {
  const map = new Map<string, VisualId>();
  for (const id of VISUAL_IDS) {
    for (const name of Object.values(EXERCISE_NAMES[id] ?? {})) map.set(normalize(name), id);
  }
  return map;
})();

// Below this, containment matches drift into false positives ("curl", "press").
const MIN_MATCH_LEN = 6;

/**
 * Frames key for an exercise: catalog ids map directly; custom exercises
 * reuse a catalog visual when their name matches a catalog name (equality
 * first, then containment either way). No match → null, callers render the
 * generic fallback.
 */
export const visualIdFor = (exercise: { id: string; name: string }): VisualId | null => {
  if (VISUALS.has(exercise.id)) return exercise.id as VisualId;
  const q = normalize(exercise.name);
  if (!q) return null;
  const exact = NAME_INDEX.get(q);
  if (exact) return exact;
  for (const [name, id] of NAME_INDEX) {
    if (name.length >= MIN_MATCH_LEN && q.includes(name)) return id;
    if (q.length >= MIN_MATCH_LEN && name.includes(q)) return id;
  }
  return null;
};
