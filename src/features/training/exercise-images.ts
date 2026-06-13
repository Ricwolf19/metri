import type { ImageSourcePropType } from 'react-native';

/**
 * Bundled exercise photos (Free Exercise DB, public domain). Keyed by the
 * exercise seed slug. Metro requires static literal `require` calls, so this
 * map is generated from `assets/exercises/*.jpg` — do not hand-edit the keys.
 *
 * Seeded exercises store `imageUrl: null` and resolve their photo here at render
 * time; user-created exercises store an on-disk file URI in `imageUrl` instead.
 */
export const EXERCISE_IMAGES: Record<string, ImageSourcePropType> = {
  'arnold-press': require('../../../assets/exercises/arnold-press.jpg'),
  'barbell-back-squat': require('../../../assets/exercises/barbell-back-squat.jpg'),
  'barbell-bench-press': require('../../../assets/exercises/barbell-bench-press.jpg'),
  'barbell-curl': require('../../../assets/exercises/barbell-curl.jpg'),
  'barbell-row': require('../../../assets/exercises/barbell-row.jpg'),
  'bulgarian-split-squat': require('../../../assets/exercises/bulgarian-split-squat.jpg'),
  'cable-crunch': require('../../../assets/exercises/cable-crunch.jpg'),
  'cable-fly': require('../../../assets/exercises/cable-fly.jpg'),
  'chest-dip': require('../../../assets/exercises/chest-dip.jpg'),
  'close-grip-bench-press': require('../../../assets/exercises/close-grip-bench-press.jpg'),
  deadlift: require('../../../assets/exercises/deadlift.jpg'),
  'dumbbell-bench-press': require('../../../assets/exercises/dumbbell-bench-press.jpg'),
  'dumbbell-curl': require('../../../assets/exercises/dumbbell-curl.jpg'),
  'dumbbell-row': require('../../../assets/exercises/dumbbell-row.jpg'),
  'face-pull': require('../../../assets/exercises/face-pull.jpg'),
  'front-squat': require('../../../assets/exercises/front-squat.jpg'),
  'hammer-curl': require('../../../assets/exercises/hammer-curl.jpg'),
  'hanging-leg-raise': require('../../../assets/exercises/hanging-leg-raise.jpg'),
  'hip-thrust': require('../../../assets/exercises/hip-thrust.jpg'),
  'incline-dumbbell-press': require('../../../assets/exercises/incline-dumbbell-press.jpg'),
  'lat-pulldown': require('../../../assets/exercises/lat-pulldown.jpg'),
  'lateral-raise': require('../../../assets/exercises/lateral-raise.jpg'),
  'leg-extension': require('../../../assets/exercises/leg-extension.jpg'),
  'leg-press': require('../../../assets/exercises/leg-press.jpg'),
  'lying-leg-curl': require('../../../assets/exercises/lying-leg-curl.jpg'),
  'machine-chest-press': require('../../../assets/exercises/machine-chest-press.jpg'),
  'machine-row': require('../../../assets/exercises/machine-row.jpg'),
  'overhead-press': require('../../../assets/exercises/overhead-press.jpg'),
  'overhead-tricep-extension': require('../../../assets/exercises/overhead-tricep-extension.jpg'),
  plank: require('../../../assets/exercises/plank.jpg'),
  'preacher-curl': require('../../../assets/exercises/preacher-curl.jpg'),
  'pull-up': require('../../../assets/exercises/pull-up.jpg'),
  'push-up': require('../../../assets/exercises/push-up.jpg'),
  'rear-delt-fly': require('../../../assets/exercises/rear-delt-fly.jpg'),
  'romanian-deadlift': require('../../../assets/exercises/romanian-deadlift.jpg'),
  'rowing-machine': require('../../../assets/exercises/rowing-machine.jpg'),
  'russian-twist': require('../../../assets/exercises/russian-twist.jpg'),
  'seated-cable-row': require('../../../assets/exercises/seated-cable-row.jpg'),
  'seated-dumbbell-press': require('../../../assets/exercises/seated-dumbbell-press.jpg'),
  skullcrusher: require('../../../assets/exercises/skullcrusher.jpg'),
  'standing-calf-raise': require('../../../assets/exercises/standing-calf-raise.jpg'),
  'stationary-bike': require('../../../assets/exercises/stationary-bike.jpg'),
  'tricep-pushdown': require('../../../assets/exercises/tricep-pushdown.jpg'),
  'walking-lunge': require('../../../assets/exercises/walking-lunge.jpg'),
};

export const getExerciseImage = (id: string): ImageSourcePropType | null =>
  EXERCISE_IMAGES[id] ?? null;
