/**
 * Default rest between working sets for every built-in catalog exercise, in
 * seconds — what a new slot, a swap or a mid-session add starts from when the
 * lifter set nothing. The preset programs prescribe their own rests (their
 * sheets say 2–3 min on everything) and are not read from here.
 *
 * The evidence, and how it maps onto the tiers:
 * - Multi-joint lifts need longer than single-joint ones. The IUSCA hypertrophy
 *   position stand (Schoenfeld et al. 2021) sets at least 2 min for multi-joint
 *   exercises and 60–90 s for single-joint and certain machine-based ones; at
 *   near-maximal loads 2 min was enough for a machine fly but the bench press
 *   needed 3–5 (Senna et al. 2016). ACSM's progression stand (2009) gives
 *   "core" lifts with heavier loads at least 2–3 min, assistance work 1–2 min,
 *   and says rest varies with how complex the exercise is.
 * - Short rest costs load and volume on the big lifts: 3 min beat 1 min for
 *   squat and bench strength and for thigh thickness in trained men (Schoenfeld
 *   et al. 2016); trained lifters need more than 2 min to maximise strength
 *   (Grgic et al. 2018); 3–5 min kept more repetitions than 1 min (de Salles et
 *   al. 2009). Lower-body work loses the most: a squat raised lactate and
 *   discomfort more than a leg extension at the same rest (Rosa et al. 2023),
 *   and leg-press repetitions kept rising from 3 to 5 min (Senna et al. 2011).
 * - For hypertrophy alone, more than 60 s carries a small benefit and more than
 *   90 s showed no clear further gain (Singer et al. 2024), with exercise type
 *   left unresolved — so nothing here rests 60 s or less, and only lifts whose
 *   load and volume suffer from a short rest go beyond 2 min.
 *
 * Tiers grade by how much muscle and how many joints a set loads, how much
 * balance and bracing it demands (free weight over a guided path, standing over
 * seated or supported) and whether the spine carries the weight. Unilateral
 * lifts take their tier unchanged: the timer starts after both sides, so each
 * limb already rests the timer plus the other side's set, while a two-sided set
 * of lunges doubles the systemic work — neither earns a separate adjustment.
 */

/** Barbell lifts that load legs, hips and spine together: the most mass and the heaviest weights. */
const WHOLE_BODY_BARBELL = 210;
/** Heavy barbell compounds and the lower-body machine compounds that move the most muscle. */
const HEAVY_COMPOUND = 180;
/** Free-weight compounds with lighter loads or less bracing: dumbbells, seated, rows, lunges. */
const FREE_WEIGHT_COMPOUND = 150;
/** Compounds a machine, cable or bench steadies, and the heaviest single-joint lift. */
const SUPPORTED_COMPOUND = 120;
/** Single-joint work for a large muscle: quads, hamstrings, chest, lats, posterior chain. */
const LARGE_ISOLATION = 90;
/** Single-joint work for a small muscle: arms, side and rear delts, calves, abs. */
const SMALL_ISOLATION = 75;

export const CATALOG_REST_SECONDS: Readonly<Record<string, number>> = {
  // Squat and both deadlifts: the spine carries the load the legs and hips move.
  'barbell-back-squat': WHOLE_BODY_BARBELL,
  deadlift: WHOLE_BODY_BARBELL,
  'sumo-deadlift': WHOLE_BODY_BARBELL,

  // Barbell presses and hinge, standing press; leg machines that load quads and glutes heavily.
  'barbell-bench-press': HEAVY_COMPOUND,
  'incline-bench-press': HEAVY_COMPOUND,
  'overhead-press': HEAVY_COMPOUND,
  'romanian-deadlift': HEAVY_COMPOUND,
  'leg-press': HEAVY_COMPOUND,
  'hack-squat': HEAVY_COMPOUND,
  'smith-machine-squat': HEAVY_COMPOUND,

  // Dumbbell and seated presses, a triceps-led bench, free rows, pull-ups, lunges.
  'close-grip-bench-press': FREE_WEIGHT_COMPOUND,
  'seated-barbell-press': FREE_WEIGHT_COMPOUND,
  'seated-dumbbell-press': FREE_WEIGHT_COMPOUND,
  'dumbbell-bench-press': FREE_WEIGHT_COMPOUND,
  'incline-dumbbell-press': FREE_WEIGHT_COMPOUND,
  'smith-machine-bench-press': FREE_WEIGHT_COMPOUND,
  'barbell-row': FREE_WEIGHT_COMPOUND,
  't-bar-row': FREE_WEIGHT_COMPOUND,
  'pull-up': FREE_WEIGHT_COMPOUND,
  'dumbbell-romanian-deadlift': FREE_WEIGHT_COMPOUND,
  'bulgarian-split-squat': FREE_WEIGHT_COMPOUND,
  'walking-lunge': FREE_WEIGHT_COMPOUND,
  'reverse-lunge': FREE_WEIGHT_COMPOUND,

  // Machine presses, pulldowns, supported rows, a squat limited by what the hands hold, hip thrust.
  'machine-chest-press': SUPPORTED_COMPOUND,
  'machine-shoulder-press': SUPPORTED_COMPOUND,
  'lat-pulldown': SUPPORTED_COMPOUND,
  'supinated-lat-pulldown': SUPPORTED_COMPOUND,
  'close-grip-lat-pulldown': SUPPORTED_COMPOUND,
  'wide-grip-lat-pulldown': SUPPORTED_COMPOUND,
  'assisted-pull-up': SUPPORTED_COMPOUND,
  'seated-cable-row': SUPPORTED_COMPOUND,
  'machine-row': SUPPORTED_COMPOUND,
  'chest-supported-row': SUPPORTED_COMPOUND,
  'dumbbell-row': SUPPORTED_COMPOUND,
  'goblet-squat': SUPPORTED_COMPOUND,
  'hip-thrust': SUPPORTED_COMPOUND,

  // Leg extension and curls, flyes, pullovers, back extension.
  'leg-extension': LARGE_ISOLATION,
  'lying-leg-curl': LARGE_ISOLATION,
  'standing-leg-curl': LARGE_ISOLATION,
  'dumbbell-fly': LARGE_ISOLATION,
  'cable-fly': LARGE_ISOLATION,
  'machine-fly': LARGE_ISOLATION,
  pullover: LARGE_ISOLATION,
  'cable-pullover': LARGE_ISOLATION,
  'back-extension': LARGE_ISOLATION,

  // Curls, triceps extensions, raises and rear-delt flies, calves, abs.
  'barbell-curl': SMALL_ISOLATION,
  'dumbbell-curl': SMALL_ISOLATION,
  'cable-curl': SMALL_ISOLATION,
  'hammer-curl': SMALL_ISOLATION,
  'cable-hammer-curl': SMALL_ISOLATION,
  'preacher-curl': SMALL_ISOLATION,
  'machine-preacher-curl': SMALL_ISOLATION,
  'spider-curl': SMALL_ISOLATION,
  'barbell-spider-curl': SMALL_ISOLATION,
  'incline-dumbbell-curl': SMALL_ISOLATION,
  skullcrusher: SMALL_ISOLATION,
  'barbell-skullcrusher': SMALL_ISOLATION,
  'overhead-tricep-extension': SMALL_ISOLATION,
  'cable-overhead-extension': SMALL_ISOLATION,
  'french-press': SMALL_ISOLATION,
  'tricep-pushdown': SMALL_ISOLATION,
  'cable-kickback': SMALL_ISOLATION,
  'dumbbell-kickback': SMALL_ISOLATION,
  'lateral-raise': SMALL_ISOLATION,
  'cable-lateral-raise': SMALL_ISOLATION,
  'machine-lateral-raise': SMALL_ISOLATION,
  'rear-delt-fly': SMALL_ISOLATION,
  'machine-rear-delt-fly': SMALL_ISOLATION,
  'standing-calf-raise': SMALL_ISOLATION,
  'seated-calf-raise': SMALL_ISOLATION,
  'single-leg-calf-raise': SMALL_ISOLATION,
  crunch: SMALL_ISOLATION,
  'cable-crunch': SMALL_ISOLATION,
  'decline-sit-up': SMALL_ISOLATION,
  'machine-crunch': SMALL_ISOLATION,
};
