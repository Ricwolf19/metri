import { normalize } from './exercise-visuals';
import { WARMUP_COPY } from './warmup-content';

/**
 * Warm-up steps with a bundled demo (`assets/exercises/<id>-{1..3}.png`,
 * provenance in ATTRIBUTION.md there). Steps without a faithful match — band
 * dislocates, 90/90, ankle rocks, ramp sets — stay text-only: a wrong-movement
 * visual teaches worse than none.
 */
export type WarmupVisualId =
  | 'cycling'
  | 'band-pull-apart'
  | 'glute-bridge'
  | 'dead-bug'
  | 'scapular-push-up'
  | 'bodyweight-squat'
  | 'cat-cow-stretch'
  | 'kneeling-hip-flexor-stretch'
  | 'hamstring-stretch'
  | 'doorway-chest-stretch'
  | 'wall-calf-stretch';

/** Keyed by the EN step name; the ES name at the same position inherits it. */
const BY_EN_STEP: Record<string, WarmupVisualId> = {
  'Easy cardio — bike, row or incline walk': 'cycling',
  'Easy cardio — row or bike': 'cycling',
  'Easy cardio — bike': 'cycling',
  'Band pull-apart': 'band-pull-apart',
  'Glute bridge': 'glute-bridge',
  'Dead bug': 'dead-bug',
  'Scapular push-up': 'scapular-push-up',
  'Bodyweight squat, slow': 'bodyweight-squat',
  'Cat–cow': 'cat-cow-stretch',
  'Hip flexor stretch (half kneeling)': 'kneeling-hip-flexor-stretch',
  'Hamstring stretch, hips hinged': 'hamstring-stretch',
  'Doorway chest stretch': 'doorway-chest-stretch',
  'Calf stretch against a wall': 'wall-calf-stretch',
};

// Resolved by name, never stored: the steps JSON is synced wire format, and a
// copied routine keeps its demos without carrying anything new.
const INDEX: ReadonlyMap<string, WarmupVisualId> = (() => {
  const map = new Map<string, WarmupVisualId>();
  for (const [id, en] of Object.entries(WARMUP_COPY.en)) {
    const es = WARMUP_COPY.es[id as keyof typeof WARMUP_COPY.es];
    en.steps.forEach((step, i) => {
      const visual = BY_EN_STEP[step.name];
      if (!visual) return;
      map.set(normalize(step.name), visual);
      const esName = es.steps[i]?.name;
      if (esName) map.set(normalize(esName), visual);
    });
  }
  return map;
})();

/** Demo for a warm-up step by its (EN or ES) name; custom steps match by name too. */
export const warmupVisualFor = (stepName: string): WarmupVisualId | null =>
  INDEX.get(normalize(stepName)) ?? null;
