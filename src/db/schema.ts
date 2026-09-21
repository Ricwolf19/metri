import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * Drizzle schema (SQLite — the on-device source of truth).
 *
 * TIMESTAMPS: every date is stored as an INTEGER epoch-ms (`{ mode: 'timestamp_ms' }`)
 * and surfaced to the app as a JS `Date`. Use `tsMs` for the column and `NOW_MS`
 * for a "set to now" SQL default; in repos, write a plain `new Date()`.
 */
const tsMs = (name: string) => integer(name, { mode: 'timestamp_ms' });
/** SQL expression for the current time in epoch-ms (second precision). */
export const NOW_MS = sql`(unixepoch() * 1000)`;

export const appMeta = sqliteTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value'),
  updatedAt: tsMs('updated_at').notNull().default(NOW_MS),
});

export type AppMeta = typeof appMeta.$inferSelect;

export type UserRole = 'admin' | 'user';
export type Sex = 'male' | 'female';
/** Activity level keys — multipliers live in `@/features/bmr/calc`. */
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

/** Whether this row mirrors a Better Auth account or lives only on-device. */
export type AuthKind = 'local' | 'remote';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  // NULL for local-only users; the anchor key when a remote account exists.
  email: text('email').unique(),
  // 'local' rows never sync or revalidate; a later sign-in adopts the row in place (AGENTS.md).
  authKind: text('auth_kind').$type<AuthKind>().notNull().default('remote'),

  // No credential material lives here. Authentication is Better Auth against the
  // metri.info backend; this row is only the local mirror of that account.
  role: text('role').$type<UserRole>().notNull().default('user'),
  // Entitlement plan, mirrored from the remote Better Auth session (the server
  // is authoritative). Cached locally so the badge/gate resolve offline.
  plan: text('plan').notNull().default('free'),

  displayName: text('display_name'),
  avatarUri: text('avatar_uri'),
  avatarColor: text('avatar_color'),
  // Preset SVG avatar key (see components/ui/avatars) — used when no photo is set.
  avatarId: text('avatar_id'),

  // Latest snapshot only — BMR/TDEE read it. The history lives in `body_metrics`.
  sex: text('sex').$type<Sex>(),
  age: integer('age'),
  heightCm: real('height_cm'),
  weightKg: real('weight_kg'),
  activityLevel: text('activity_level').$type<ActivityLevel>(),
  bodyFatPct: real('body_fat_pct'),

  // Saved calculation result (latest), so it can be consulted from the profile.
  bmr: real('bmr'),
  tdee: real('tdee'),
  bmrFormula: text('bmr_formula'),
  bmrComputedAt: tsMs('bmr_computed_at'),

  // Set when the user completes the first-launch onboarding flow.
  onboardedAt: tsMs('onboarded_at'),

  createdAt: tsMs('created_at').notNull().default(NOW_MS),
  updatedAt: tsMs('updated_at').notNull().default(NOW_MS),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
/** Alias kept so call sites read intentionally; the row carries no secrets. */
export type PublicUser = User;

export type ReminderFrequency = 'daily' | 'weekly';

/**
 * Local reminders (weigh-ins, measurements, water…). A weekly one maps to ONE OS
 * notification per selected day, so `notificationIds` keeps the whole set or a
 * toggle/edit leaves orphaned notifications behind. `weekdays` (1=Sun…7=Sat)
 * applies only to `weekly`; `hour` is always 24h (12/24h is display-only).
 */
export const reminders = sqliteTable('reminders', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  frequency: text('frequency').$type<ReminderFrequency>().notNull().default('daily'),
  hour: integer('hour').notNull().default(8),
  minute: integer('minute').notNull().default(0),
  weekdays: text('weekdays', { mode: 'json' }).$type<number[]>(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  notificationIds: text('notification_ids', { mode: 'json' }).$type<string[]>(),
  createdAt: tsMs('created_at').notNull().default(NOW_MS),
  updatedAt: tsMs('updated_at').notNull().default(NOW_MS),
});

export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;

/**
 * Progress photos. The image **files live on disk** (app document dir) — only the
 * file paths + metadata are stored here (never the binary). `takenAt` is an
 * epoch-ms `Date`; `weightKg` snapshots the user's weight at capture for an overlay.
 */
export const progressPhotos = sqliteTable('progress_photos', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  uri: text('uri').notNull(),
  thumbUri: text('thumb_uri').notNull(),
  takenAt: tsMs('taken_at').notNull(),
  weightKg: real('weight_kg'),
  note: text('note'),
  createdAt: tsMs('created_at').notNull().default(NOW_MS),
});

export type ProgressPhoto = typeof progressPhotos.$inferSelect;

/* ────────────────────────────────────────────────────────────────────────────
 * Training system (v1.2) — programmable routines, progressive overload, logging.
 *
 * Two layers share most tables:
 *   • TEMPLATES — seeded (or user-authored) blueprints. `user_program_id` IS NULL.
 *   • ENROLLED COPIES — on enrolment we **deep-copy** a template's rows into
 *     user-owned rows tagged with the new `user_programs.id` (`user_program_id`).
 *     The workout engine then reads only the user's copy, so editing a program
 *     never mutates the shared template.
 *
 * Weeks are stored **routine-relative (1–4)**; the absolute program week is
 * derived from the routine's `order_index` + position. Suggested weights are
 * derived from `set_logs` history (no MMKV cache). All FKs are intentionally
 * loose text refs (matching the rest of the schema; expo-sqlite runs with
 * foreign_keys OFF) — referential cleanup is handled in repo code.
 * ──────────────────────────────────────────────────────────────────────────── */

export type ExerciseCategory =
  'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'full_body' | 'cardio';
export type Equipment =
  'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'kettlebell' | 'other';

/** Global exercise library. Seeded staples have `userId` NULL; user-made ones set it. */
export const exercises = sqliteTable(
  'exercises',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    category: text('category').$type<ExerciseCategory>().notNull(),
    primaryMuscles: text('primary_muscles', { mode: 'json' }).$type<string[]>(),
    secondaryMuscles: text('secondary_muscles', { mode: 'json' }).$type<string[]>(),
    equipment: text('equipment').$type<Equipment>(),
    imageUrl: text('image_url'),
    instructions: text('instructions'),
    isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
    userId: text('user_id'),
    createdAt: tsMs('created_at').notNull().default(NOW_MS),
    updatedAt: tsMs('updated_at'),
  },
  (t) => [index('idx_exercises_category').on(t.category), index('idx_exercises_name').on(t.name)],
);

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;

export const programs = sqliteTable(
  'programs',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    durationWeeks: integer('duration_weeks'),
    // Retired (unused by the app); kept because `programs` is synced and the wire format is add-only.
    difficulty: text('difficulty'),
    goal: text('goal'),
    isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
    /** Author of a custom program; NULL for seeded templates. */
    userId: text('user_id'),
    /** Set on an enrolled deep-copy; NULL = template. */
    userProgramId: text('user_program_id'),
    createdAt: tsMs('created_at').notNull().default(NOW_MS),
    updatedAt: tsMs('updated_at').notNull().default(NOW_MS),
  },
  (t) => [index('idx_programs_user_program').on(t.userProgramId)],
);

export type Program = typeof programs.$inferSelect;
export type NewProgram = typeof programs.$inferInsert;

/** A multi-week block within a program (e.g. "Rutina 1 — Base", 4 weeks). */
export const routines = sqliteTable(
  'routines',
  {
    id: text('id').primaryKey(),
    programId: text('program_id').notNull(),
    name: text('name').notNull(),
    orderIndex: integer('order_index').notNull().default(0),
    durationWeeks: integer('duration_weeks').notNull().default(4),
    userProgramId: text('user_program_id'),
    createdAt: tsMs('created_at').notNull().default(NOW_MS),
    // Nullable so the migration is a plain ADD COLUMN; sync reads COALESCE(updatedAt, createdAt).
    updatedAt: tsMs('updated_at'),
  },
  (t) => [index('idx_routines_program').on(t.programId)],
);

export type Routine = typeof routines.$inferSelect;
export type NewRoutine = typeof routines.$inferInsert;

/** A training day within a routine (e.g. "Push", "Pull", "Legs"). */
export const workoutDays = sqliteTable(
  'workout_days',
  {
    id: text('id').primaryKey(),
    routineId: text('routine_id').notNull(),
    name: text('name').notNull(),
    focusMuscles: text('focus_muscles', { mode: 'json' }).$type<string[]>(),
    orderIndex: integer('order_index').notNull().default(0),
    // Enrolled copy only; weekday is expo-numbered — @see AGENTS.md#conventions.
    // startMinute: minutes after local midnight (0–1439), one integer that sorts naturally.
    weekday: integer('weekday'),
    startMinute: integer('start_minute'),
    userProgramId: text('user_program_id'),
    createdAt: tsMs('created_at').notNull().default(NOW_MS),
    updatedAt: tsMs('updated_at'),
  },
  (t) => [index('idx_workout_days_routine').on(t.routineId)],
);

export type WorkoutDay = typeof workoutDays.$inferSelect;
export type NewWorkoutDay = typeof workoutDays.$inferInsert;

/** An exercise slot within a workout day (ordered position + default rest). */
export const workoutDayExercises = sqliteTable(
  'workout_day_exercises',
  {
    id: text('id').primaryKey(),
    workoutDayId: text('workout_day_id').notNull(),
    exerciseId: text('exercise_id').notNull(),
    orderIndex: integer('order_index').notNull().default(0),
    defaultRestSeconds: integer('default_rest_seconds').default(120),
    notes: text('notes'),
    // Short, char-limited helper tags shown as chips (technique cues, grip,
    // warmup, "don't go to failure", etc.). Separate from free-form `notes`.
    badges: text('badges', { mode: 'json' }).$type<string[]>(),
    // Interchangeable exercises ("deadlift or sumo") the session can swap to.
    alternativeExerciseIds: text('alternative_exercise_ids', { mode: 'json' }).$type<string[]>(),
    userProgramId: text('user_program_id'),
    updatedAt: tsMs('updated_at').notNull().default(NOW_MS),
  },
  (t) => [index('idx_workout_day_exercises_day').on(t.workoutDayId)],
);

export type WorkoutDayExercise = typeof workoutDayExercises.$inferSelect;
export type NewWorkoutDayExercise = typeof workoutDayExercises.$inferInsert;

/** How intensity for a week is expressed. `percentage` fills the %1RM gap. */
export type IntensityType = 'rir' | 'rpe' | 'percentage';

/** One block of sets sharing a scheme — a week can prescribe several (e.g. the
 * classic "1×6 RIR 0 top set + 3×6 RIR 3-4 back-off"). */
export type SetGroup = {
  sets: number;
  reps: number;
  repsMax?: number;
  rirMin?: number;
  rirMax?: number;
  toFailure?: boolean;
};

/**
 * Per-week prescription for a slot — the heart of progressive overload.
 * `weekNumber` is routine-relative (1–4). `intensityValue` carries the RPE or
 * %1RM target when `intensityType` isn't `rir`; RIR ranges use `rirMin/rirMax`.
 */
export const weekConfigs = sqliteTable(
  'week_configs',
  {
    id: text('id').primaryKey(),
    workoutDayExerciseId: text('workout_day_exercise_id').notNull(),
    weekNumber: integer('week_number').notNull(),
    sets: integer('sets').notNull(),
    reps: integer('reps').notNull(), // target / lower bound of the rep range
    repsMax: integer('reps_max'), // upper bound; null ⇒ single value (e.g. "6-8")
    rirMin: integer('rir_min'),
    rirMax: integer('rir_max'),
    toFailure: integer('to_failure', { mode: 'boolean' }).notNull().default(false),
    restSeconds: integer('rest_seconds'),
    intensityType: text('intensity_type').$type<IntensityType>().notNull().default('rir'),
    intensityValue: real('intensity_value'),
    // Multi-group prescription (top set + back-off). NULL ⇒ the flat scheme above.
    setGroups: text('set_groups', { mode: 'json' }).$type<SetGroup[]>(),
    userProgramId: text('user_program_id'),
    updatedAt: tsMs('updated_at').notNull().default(NOW_MS),
  },
  (t) => [index('idx_week_configs_slot').on(t.workoutDayExerciseId)],
);

export type WeekConfig = typeof weekConfigs.$inferSelect;
export type NewWeekConfig = typeof weekConfigs.$inferInsert;

export type UserProgramStatus = 'active' | 'paused' | 'completed' | 'abandoned';

/** A user's enrolment in a program. Owns the deep-copied template rows. */
export const userPrograms = sqliteTable(
  'user_programs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    /** The template this copy was enrolled from. */
    programId: text('program_id').notNull(),
    status: text('status').$type<UserProgramStatus>().notNull().default('active'),
    startedAt: tsMs('started_at'),
    completedAt: tsMs('completed_at'),
    /** Position is stored routine-relative; the absolute program week is derived. */
    currentRoutineId: text('current_routine_id'),
    currentWeek: integer('current_week').notNull().default(1),
    // The user's chosen training days (1=Sun…7=Sat) — drives "today's session"
    // and the automatic training-time notifications.
    trainingWeekdays: text('training_weekdays', { mode: 'json' }).$type<number[]>(),
    createdAt: tsMs('created_at').notNull().default(NOW_MS),
    updatedAt: tsMs('updated_at').notNull().default(NOW_MS),
  },
  (t) => [index('idx_user_programs_user').on(t.userId)],
);

export type UserProgram = typeof userPrograms.$inferSelect;
export type NewUserProgram = typeof userPrograms.$inferInsert;

export type WorkoutStatus = 'in_progress' | 'completed' | 'abandoned';

/** The prescription materialized when a session starts — the session renders
 * from this, immune to program edits, and history stays faithful. */
export type PlannedSlot = {
  slotId: string;
  exerciseId: string;
  name: string;
  setGroups: SetGroup[];
  restSeconds: number | null;
  badges: string[];
  alternativeExerciseIds: string[];
};

/**
 * A training session. The single `in_progress` row per user IS the active
 * session — there is no global store; the UI reads it from the DB. `weekNumber`
 * is the routine-relative week trained.
 */
export const workoutLogs = sqliteTable(
  'workout_logs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    userProgramId: text('user_program_id').notNull(),
    workoutDayId: text('workout_day_id').notNull(),
    status: text('status').$type<WorkoutStatus>().notNull().default('in_progress'),
    weekNumber: integer('week_number').notNull(),
    startedAt: tsMs('started_at').notNull().default(NOW_MS),
    completedAt: tsMs('completed_at'),
    durationSeconds: integer('duration_seconds'),
    notes: text('notes'),
    rating: integer('rating'),
    plannedSnapshot: text('planned_snapshot', { mode: 'json' }).$type<PlannedSlot[]>(),
    createdAt: tsMs('created_at').notNull().default(NOW_MS),
    updatedAt: tsMs('updated_at'),
  },
  (t) => [
    index('idx_workout_logs_user').on(t.userId),
    index('idx_workout_logs_program').on(t.userProgramId),
    index('idx_workout_logs_status').on(t.status),
  ],
);

export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type NewWorkoutLog = typeof workoutLogs.$inferInsert;

/** A single logged set — the core training datum. Weight stored in kg. */
export const setLogs = sqliteTable(
  'set_logs',
  {
    id: text('id').primaryKey(),
    workoutLogId: text('workout_log_id').notNull(),
    exerciseId: text('exercise_id').notNull(),
    setNumber: integer('set_number').notNull(),
    weightKg: real('weight_kg').notNull(),
    reps: integer('reps').notNull(),
    rpe: integer('rpe'),
    rir: integer('rir'),
    isWarmup: integer('is_warmup', { mode: 'boolean' }).notNull().default(false),
    isFailure: integer('is_failure', { mode: 'boolean' }).notNull().default(false),
    notes: text('notes'),
    restBeforeSeconds: integer('rest_before_seconds'),
    createdAt: tsMs('created_at').notNull().default(NOW_MS),
    updatedAt: tsMs('updated_at'),
  },
  (t) => [
    index('idx_set_logs_workout').on(t.workoutLogId),
    index('idx_set_logs_exercise').on(t.exerciseId),
  ],
);

export type SetLog = typeof setLogs.$inferSelect;
export type NewSetLog = typeof setLogs.$inferInsert;

/** Trained as planned · deliberate rest · missed a planned session. */
export type TrainingDayStatus = 'trained' | 'rest' | 'skipped';
/** Why a planned session was missed — powers the "why not" legend. */
export const SKIP_REASONS = [
  'sick',
  'busy',
  'travel',
  'injury',
  'fatigue',
  'deload',
  'other',
] as const;
export type SkipReason = (typeof SKIP_REASONS)[number];

/**
 * One row per user per calendar day recording whether they trained — the
 * substrate for the heatmap and streaks. `date` is the **device-local** day as
 * 'YYYY-MM-DD' (not an instant) so a day never drifts across the UTC boundary
 * and month-range queries are plain string comparisons.
 */
export const trainingDays = sqliteTable(
  'training_days',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    date: text('date').notNull(),
    status: text('status').$type<TrainingDayStatus>().notNull(),
    /** Only meaningful when status = 'skipped'. */
    skipReason: text('skip_reason').$type<SkipReason>(),
    note: text('note'),
    /** The session that satisfied this day, when trained. */
    workoutLogId: text('workout_log_id'),
    /** The split that was scheduled/trained. */
    workoutDayId: text('workout_day_id'),
    createdAt: tsMs('created_at').notNull().default(NOW_MS),
    updatedAt: tsMs('updated_at').notNull().default(NOW_MS),
  },
  (t) => [
    index('idx_training_days_user').on(t.userId),
    uniqueIndex('idx_training_days_user_date').on(t.userId, t.date),
  ],
);

export type TrainingDay = typeof trainingDays.$inferSelect;
export type NewTrainingDay = typeof trainingDays.$inferInsert;

/**
 * Whole-body readings over time — the history `users` deliberately does not keep
 * (that row holds only the latest snapshot, which BMR/TDEE read). Tape girths
 * are NOT columns here: they live long-format in `body_measurements`, so a new
 * site never needs a migration.
 *
 * `date` is the **device-local** day as 'YYYY-MM-DD', matching `training_days`,
 * and is unique per user: one row per day, re-weighing updates it.
 */
export const bodyMetrics = sqliteTable(
  'body_metrics',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    date: text('date').notNull(),
    weightKg: real('weight_kg'),
    bodyFatPct: real('body_fat_pct'),
    note: text('note'),
    createdAt: tsMs('created_at').notNull().default(NOW_MS),
    updatedAt: tsMs('updated_at').notNull().default(NOW_MS),
  },
  (t) => [
    index('idx_body_metrics_user').on(t.userId),
    uniqueIndex('idx_body_metrics_user_date').on(t.userId, t.date),
  ],
);

export type BodyMetric = typeof bodyMetrics.$inferSelect;
export type NewBodyMetric = typeof bodyMetrics.$inferInsert;

/**
 * Tape measurements, one row per (day, site). Long format on purpose: the set
 * of sites is a catalogue in code (`features/body/sites.ts`), so adding one is
 * a catalogue entry, never a migration. `site` is therefore plain text — a row
 * written by a newer build with a site this build does not know is kept and
 * simply not rendered.
 *
 * Always centimetres; inches are a display concern.
 */
export const bodyMeasurements = sqliteTable(
  'body_measurements',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    date: text('date').notNull(),
    site: text('site').notNull(),
    valueCm: real('value_cm').notNull(),
    createdAt: tsMs('created_at').notNull().default(NOW_MS),
    updatedAt: tsMs('updated_at').notNull().default(NOW_MS),
  },
  (t) => [
    index('idx_body_measurements_user').on(t.userId),
    uniqueIndex('idx_body_measurements_user_date_site').on(t.userId, t.date, t.site),
  ],
);

export type BodyMeasurement = typeof bodyMeasurements.$inferSelect;

export type BodyPhase = 'cut' | 'maintain' | 'recomp' | 'bulk';
export type TrainingLevel = 'beginner' | 'intermediate' | 'advanced';

/** A calorie re-adjustment made mid-phase. It moves carbs only, and it never
 * resets the phase's start point — the weight calendar keeps its origin. */
export type GoalAdjustment = { date: string; kcalDelta: number };

/**
 * A nutrition phase: what the lifter is doing (cut/bulk/…), how fast, from what
 * starting point, and the targets that follow. Phases are HISTORY — a row per
 * phase, never an overwritten setting — because the weekly target-weight
 * calendar is derived from `startDate` + `startWeightKg` + `rateKgPerWeek`.
 *
 * The ACTIVE phase is the newest row with `endedAt IS NULL`. There is
 * deliberately no unique index enforcing one: two offline devices can each
 * start a phase, and a partial unique index cannot be reconciled by sync.
 * `startGoal` ends the previous phase in the same transaction instead.
 *
 * `rateKgPerWeek` is SIGNED (negative = losing); the UI shows its magnitude.
 * The `*AtStart` columns freeze the inputs the targets were computed from, so
 * a later profile edit never silently rewrites a running phase.
 */
export const bodyGoals = sqliteTable(
  'body_goals',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    phase: text('phase').$type<BodyPhase>().notNull(),
    startDate: text('start_date').notNull(),
    startWeightKg: real('start_weight_kg').notNull(),
    rateKgPerWeek: real('rate_kg_per_week').notNull(),
    durationWeeks: integer('duration_weeks').notNull(),
    /** Expo-numbered (1=Sun…7=Sat), like every weekday column. */
    checkinWeekday: integer('checkin_weekday').notNull(),
    trainingLevel: text('training_level').$type<TrainingLevel>(),
    bodyFatPctAtStart: real('body_fat_pct_at_start'),
    tdeeAtStart: real('tdee_at_start'),
    targetKcal: real('target_kcal').notNull(),
    proteinG: real('protein_g').notNull(),
    fatG: real('fat_g').notNull(),
    carbsG: real('carbs_g').notNull(),
    adjustments: text('adjustments', { mode: 'json' }).$type<GoalAdjustment[]>(),
    endedAt: tsMs('ended_at'),
    createdAt: tsMs('created_at').notNull().default(NOW_MS),
    updatedAt: tsMs('updated_at').notNull().default(NOW_MS),
  },
  (t) => [index('idx_body_goals_user').on(t.userId)],
);

export type BodyGoal = typeof bodyGoals.$inferSelect;

/**
 * Foods the user defined themselves. The shipped catalogue is NOT in the
 * database — it is a generated module (`features/nutrition/foods.data.ts`) —
 * so this table only ever holds user-owned rows. Values are per 100 g.
 */
export const customFoods = sqliteTable(
  'custom_foods',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    kcal: real('kcal').notNull(),
    proteinG: real('protein_g').notNull().default(0),
    carbsG: real('carbs_g').notNull().default(0),
    fatG: real('fat_g').notNull().default(0),
    fiberG: real('fiber_g').notNull().default(0),
    /** A typical amount in grams, prefilled when logging. */
    servingG: real('serving_g').notNull().default(100),
    createdAt: tsMs('created_at').notNull().default(NOW_MS),
    updatedAt: tsMs('updated_at').notNull().default(NOW_MS),
  },
  (t) => [index('idx_custom_foods_user').on(t.userId)],
);

export type CustomFood = typeof customFoods.$inferSelect;

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/**
 * One eaten item. The nutrient columns are the entry's TOTALS, snapshotted at
 * log time — same reasoning as `workout_logs.plannedSnapshot`: regenerating the
 * catalogue or editing a custom food must never rewrite what was eaten.
 *
 * `foodId` is a catalogue slug, a `custom_foods.id`, or NULL for a quick-add
 * (calories typed directly, no food behind them). `name` is the label as
 * logged; catalogue entries re-resolve theirs at render so the language follows
 * the app, and fall back to this when the food is no longer known.
 *
 * `date` is the device-local day 'YYYY-MM-DD', like every other daily table.
 */
export const foodLogs = sqliteTable(
  'food_logs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    date: text('date').notNull(),
    meal: text('meal').$type<Meal>().notNull(),
    foodId: text('food_id'),
    name: text('name').notNull(),
    /** NULL for a quick-add, which has no weight. */
    grams: real('grams'),
    kcal: real('kcal').notNull(),
    proteinG: real('protein_g').notNull().default(0),
    carbsG: real('carbs_g').notNull().default(0),
    fatG: real('fat_g').notNull().default(0),
    fiberG: real('fiber_g').notNull().default(0),
    createdAt: tsMs('created_at').notNull().default(NOW_MS),
    updatedAt: tsMs('updated_at').notNull().default(NOW_MS),
  },
  (t) => [index('idx_food_logs_user_date').on(t.userId, t.date)],
);

export type FoodLog = typeof foodLogs.$inferSelect;

/**
 * Per-user defaults for an exercise, applied whenever it is added to a split
 * (rest, badges, alternatives) — "configure once, reuse in every plan". One
 * row per (user, exercise); a per-program override remains the open path.
 */
export const exerciseSettings = sqliteTable(
  'exercise_settings',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    exerciseId: text('exercise_id').notNull(),
    restSeconds: integer('rest_seconds'),
    badges: text('badges', { mode: 'json' }).$type<string[]>(),
    alternativeExerciseIds: text('alternative_exercise_ids', { mode: 'json' }).$type<string[]>(),
    createdAt: tsMs('created_at').notNull().default(NOW_MS),
    updatedAt: tsMs('updated_at').notNull().default(NOW_MS),
  },
  (t) => [
    index('idx_exercise_settings_user').on(t.userId),
    uniqueIndex('idx_exercise_settings_user_exercise').on(t.userId, t.exerciseId),
  ],
);

export type ExerciseSetting = typeof exerciseSettings.$inferSelect;

/** One line of a warm-up: what to do, and roughly how much of it. */
export type WarmupStep = { name: string; detail?: string };

/**
 * Warm-up and mobility routines — the work around the session rather than the
 * session itself, so it is deliberately NOT a program tree: a flat ordered
 * list of steps in JSON, one row per routine.
 *
 * Seeded rows have a null `userId` (same contract as the exercise catalog) and
 * their copy is bilingual in `warmup-content.ts`; a user's own rows carry their
 * text verbatim.
 */
export const warmupRoutines = sqliteTable(
  'warmup_routines',
  {
    id: text('id').primaryKey(),
    /** Null = shipped by metri. */
    userId: text('user_id'),
    kind: text('kind').$type<'warmup' | 'mobility'>().notNull(),
    name: text('name').notNull(),
    description: text('description'),
    steps: text('steps', { mode: 'json' }).$type<WarmupStep[]>().notNull(),
    orderIndex: integer('order_index').notNull().default(0),
    isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
    createdAt: tsMs('created_at').notNull().default(NOW_MS),
    updatedAt: tsMs('updated_at').notNull().default(NOW_MS),
  },
  (t) => [index('idx_warmup_routines_user').on(t.userId)],
);

export type WarmupRoutine = typeof warmupRoutines.$inferSelect;

/**
 * Tombstone log. Local deletes stay hard (reads never change), but each delete
 * on a syncable table appends a row here so the delta-sync engine can propagate
 * the removal to the server (and vice-versa) instead of resurrecting the row on
 * the next pull. Cleared once a tombstone has been pushed.
 */
export const syncDeletions = sqliteTable(
  'sync_deletions',
  {
    id: text('id').primaryKey(),
    tableName: text('table_name').notNull(),
    rowId: text('row_id').notNull(),
    deletedAt: tsMs('deleted_at').notNull().default(NOW_MS),
    /** Set once the tombstone has been acknowledged by a successful push. */
    pushedAt: tsMs('pushed_at'),
  },
  (t) => [index('idx_sync_deletions_pushed').on(t.pushedAt)],
);

export type SyncDeletion = typeof syncDeletions.$inferSelect;
