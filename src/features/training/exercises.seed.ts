import type { Equipment, ExerciseCategory } from '@/db/schema';

/**
 * A curated set of ~40 staple gym movements — enough to build real programs
 * without bundling the full 800-entry Free Exercise DB. `id` is a stable slug
 * (referenced by program seeds); `imageUrl` is left null for now and the UI
 * falls back to a muscle-group icon (bundling photos is a later sub-task).
 */
export type ExerciseSeed = {
  id: string;
  name: string;
  category: ExerciseCategory;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: Equipment;
  instructions: string;
};

export const EXERCISE_SEEDS: ExerciseSeed[] = [
  // ── Chest ──────────────────────────────────────────────────────────────
  {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    category: 'chest',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'front_delts'],
    equipment: 'barbell',
    instructions:
      'Lie on a flat bench, grip the bar slightly wider than shoulders, lower to mid-chest with control, then press back up.',
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    category: 'chest',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['front_delts', 'triceps'],
    equipment: 'dumbbell',
    instructions:
      'Set the bench to ~30°. Press the dumbbells up and slightly together, lowering until you feel a stretch in the upper chest.',
  },
  {
    id: 'dumbbell-bench-press',
    name: 'Dumbbell Bench Press',
    category: 'chest',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'front_delts'],
    equipment: 'dumbbell',
    instructions:
      'On a flat bench, press the dumbbells from chest level to lockout, keeping the wrists stacked over the elbows.',
  },
  {
    id: 'machine-chest-press',
    name: 'Machine Chest Press',
    category: 'chest',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps'],
    equipment: 'machine',
    instructions:
      'Set the seat so handles align with mid-chest. Press out smoothly and control the return.',
  },
  {
    id: 'cable-fly',
    name: 'Cable Fly',
    category: 'chest',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['front_delts'],
    equipment: 'cable',
    instructions:
      'With a slight forward lean, sweep the handles together in an arc, squeezing the chest at the end.',
  },
  {
    id: 'push-up',
    name: 'Push-Up',
    category: 'chest',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'core'],
    equipment: 'bodyweight',
    instructions:
      'Hands under shoulders, body in a straight line. Lower until the chest nears the floor, then press up.',
  },
  {
    id: 'chest-dip',
    name: 'Chest Dip',
    category: 'chest',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'front_delts'],
    equipment: 'bodyweight',
    instructions:
      'Lean forward on parallel bars and lower until the shoulders are below the elbows, then press up.',
  },

  // ── Back ───────────────────────────────────────────────────────────────
  {
    id: 'deadlift',
    name: 'Deadlift',
    category: 'back',
    primaryMuscles: ['back', 'hamstrings'],
    secondaryMuscles: ['glutes', 'traps', 'forearms'],
    equipment: 'barbell',
    instructions:
      'Hinge at the hips with a flat back, grip the bar, drive through the floor and stand tall locking the hips.',
  },
  {
    id: 'pull-up',
    name: 'Pull-Up',
    category: 'back',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    equipment: 'bodyweight',
    instructions:
      'Hang with an overhand grip and pull until the chin clears the bar, then lower under control.',
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    category: 'back',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    equipment: 'cable',
    instructions:
      'Pull the bar to the upper chest, driving the elbows down and back; control the bar on the way up.',
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    category: 'back',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps', 'rear_delts'],
    equipment: 'barbell',
    instructions:
      'Hinge to ~45°, pull the bar to the lower ribs, squeeze the shoulder blades, then lower with control.',
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    category: 'back',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    equipment: 'cable',
    instructions:
      'Sit tall, pull the handle to the abdomen keeping the chest up, then extend the arms under control.',
  },
  {
    id: 'machine-row',
    name: 'Machine Row',
    category: 'back',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    equipment: 'machine',
    instructions: 'Chest against the pad, row the handles back driving the elbows toward the hips.',
  },
  {
    id: 'dumbbell-row',
    name: 'One-Arm Dumbbell Row',
    category: 'back',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    equipment: 'dumbbell',
    instructions:
      'Brace one hand on the bench, row the dumbbell to the hip, keeping the torso stable.',
  },

  // ── Legs ───────────────────────────────────────────────────────────────
  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    category: 'legs',
    primaryMuscles: ['quads', 'glutes'],
    secondaryMuscles: ['hamstrings', 'core'],
    equipment: 'barbell',
    instructions:
      'Bar on the upper back, brace, sit down between the hips to depth, then drive up through mid-foot.',
  },
  {
    id: 'front-squat',
    name: 'Front Squat',
    category: 'legs',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes', 'core'],
    equipment: 'barbell',
    instructions:
      'Rack the bar on the front delts with high elbows, squat upright to depth, then stand.',
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    category: 'legs',
    primaryMuscles: ['hamstrings', 'glutes'],
    secondaryMuscles: ['back'],
    equipment: 'barbell',
    instructions:
      'Soft knees, push the hips back lowering the bar along the legs until a hamstring stretch, then drive up.',
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    category: 'legs',
    primaryMuscles: ['quads', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    equipment: 'machine',
    instructions:
      'Feet shoulder-width on the platform, lower under control to ~90°, then press without locking the knees hard.',
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    category: 'legs',
    primaryMuscles: ['quads'],
    secondaryMuscles: [],
    equipment: 'machine',
    instructions: 'Extend the knees fully and squeeze the quads, then lower with control.',
  },
  {
    id: 'lying-leg-curl',
    name: 'Lying Leg Curl',
    category: 'legs',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: ['calves'],
    equipment: 'machine',
    instructions: 'Curl the pad toward the glutes, squeeze the hamstrings, then lower slowly.',
  },
  {
    id: 'walking-lunge',
    name: 'Walking Lunge',
    category: 'legs',
    primaryMuscles: ['quads', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    equipment: 'dumbbell',
    instructions:
      'Step forward into a lunge until both knees are ~90°, then drive through the front foot into the next step.',
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    category: 'legs',
    primaryMuscles: ['quads', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    equipment: 'dumbbell',
    instructions:
      'Rear foot elevated, lower straight down on the front leg, then drive up. Keep the front knee tracking the toes.',
  },
  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    category: 'legs',
    primaryMuscles: ['calves'],
    secondaryMuscles: [],
    equipment: 'machine',
    instructions:
      'Rise onto the toes for a full contraction, then lower for a deep stretch under control.',
  },
  {
    id: 'hip-thrust',
    name: 'Barbell Hip Thrust',
    category: 'legs',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings'],
    equipment: 'barbell',
    instructions:
      'Upper back on a bench, bar over the hips, drive the hips up to full lockout squeezing the glutes.',
  },

  // ── Shoulders ────────────────────────────────────────────────────────────
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    category: 'shoulders',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps'],
    equipment: 'barbell',
    instructions:
      'From the front-rack, brace the core and press the bar overhead to lockout, then lower to the collarbone.',
  },
  {
    id: 'seated-dumbbell-press',
    name: 'Seated Dumbbell Press',
    category: 'shoulders',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps'],
    equipment: 'dumbbell',
    instructions:
      'Seated with back support, press the dumbbells overhead, then lower to ear height under control.',
  },
  {
    id: 'lateral-raise',
    name: 'Dumbbell Lateral Raise',
    category: 'shoulders',
    primaryMuscles: ['side_delts'],
    secondaryMuscles: [],
    equipment: 'dumbbell',
    instructions:
      'With a slight bend in the elbows, raise the dumbbells out to shoulder height, then lower slowly.',
  },
  {
    id: 'rear-delt-fly',
    name: 'Rear Delt Fly',
    category: 'shoulders',
    primaryMuscles: ['rear_delts'],
    secondaryMuscles: ['traps'],
    equipment: 'machine',
    instructions: 'Sweep the arms back in a wide arc, squeezing the rear delts; avoid shrugging.',
  },
  {
    id: 'face-pull',
    name: 'Face Pull',
    category: 'shoulders',
    primaryMuscles: ['rear_delts'],
    secondaryMuscles: ['traps'],
    equipment: 'cable',
    instructions:
      'Pull the rope toward the face with high elbows, externally rotating at the end; control the return.',
  },
  {
    id: 'arnold-press',
    name: 'Arnold Press',
    category: 'shoulders',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps'],
    equipment: 'dumbbell',
    instructions:
      'Start with palms facing you, rotate out as you press overhead, then reverse on the way down.',
  },

  // ── Arms ───────────────────────────────────────────────────────────────
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    category: 'arms',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    equipment: 'barbell',
    instructions:
      'Elbows pinned to the sides, curl the bar up, squeeze, then lower under control without swinging.',
  },
  {
    id: 'dumbbell-curl',
    name: 'Dumbbell Curl',
    category: 'arms',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    equipment: 'dumbbell',
    instructions:
      'Curl the dumbbells while supinating the wrists, squeeze at the top, then lower slowly.',
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    category: 'arms',
    primaryMuscles: ['biceps', 'forearms'],
    secondaryMuscles: [],
    equipment: 'dumbbell',
    instructions:
      'Hold the dumbbells with a neutral grip and curl, keeping the palms facing each other throughout.',
  },
  {
    id: 'preacher-curl',
    name: 'Preacher Curl',
    category: 'arms',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    equipment: 'machine',
    instructions:
      'Arms on the pad, curl through a full range and lower until just short of full extension.',
  },
  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    category: 'arms',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: 'cable',
    instructions:
      'Elbows tucked, extend the arms down to lockout squeezing the triceps, then control the return.',
  },
  {
    id: 'overhead-tricep-extension',
    name: 'Overhead Tricep Extension',
    category: 'arms',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: 'cable',
    instructions:
      'With the load overhead, extend the elbows fully, then lower behind the head for a stretch.',
  },
  {
    id: 'close-grip-bench-press',
    name: 'Close-Grip Bench Press',
    category: 'arms',
    primaryMuscles: ['triceps'],
    secondaryMuscles: ['chest'],
    equipment: 'barbell',
    instructions:
      'Grip shoulder-width, keep the elbows close, lower to the lower chest and press to lockout.',
  },
  {
    id: 'skullcrusher',
    name: 'Skullcrusher',
    category: 'arms',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: 'barbell',
    instructions:
      'Lying down, keep the upper arms vertical and lower the bar to the forehead, then extend.',
  },

  // ── Core ───────────────────────────────────────────────────────────────
  {
    id: 'plank',
    name: 'Plank',
    category: 'core',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    equipment: 'bodyweight',
    instructions:
      'Forearms and toes on the floor, body in a straight line, brace the core and hold without sagging.',
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    category: 'core',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    equipment: 'bodyweight',
    instructions:
      'Hang from a bar and raise the legs to hip height or higher with control, avoiding swing.',
  },
  {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    category: 'core',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    equipment: 'cable',
    instructions:
      'Kneel under the rope and crunch down by flexing the spine, squeezing the abs; control the return.',
  },
  {
    id: 'russian-twist',
    name: 'Russian Twist',
    category: 'core',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    equipment: 'bodyweight',
    instructions:
      'Seated with feet up, rotate the torso side to side touching the weight near the hip each rep.',
  },

  // ── Cardio ─────────────────────────────────────────────────────────────
  {
    id: 'rowing-machine',
    name: 'Rowing Machine',
    category: 'cardio',
    primaryMuscles: ['full_body'],
    secondaryMuscles: ['back', 'legs'],
    equipment: 'machine',
    instructions:
      'Drive with the legs, then lean back and pull the handle to the ribs; reverse the sequence to return.',
  },
  {
    id: 'stationary-bike',
    name: 'Stationary Bike',
    category: 'cardio',
    primaryMuscles: ['legs'],
    secondaryMuscles: [],
    equipment: 'machine',
    instructions:
      'Maintain a steady cadence at a resistance that keeps the target heart-rate zone.',
  },
];
