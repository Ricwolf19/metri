import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Drizzle schema (SQLite — the on-device source of truth).
 *
 * `app_meta` is infrastructure plumbing so the migration pipeline is wired end
 * to end. `users` is the first domain table: it backs the local, offline-first
 * authentication and the per-user profile. When a cloud mirror (PostgreSQL +
 * Better Auth) lands later, these columns map across 1:1 and local becomes the
 * synced offline cache.
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

/** Roles drive section/access gating across the app. */
export type UserRole = 'admin' | 'user';
export type Sex = 'male' | 'female';
/** Activity level keys — multipliers live in `@/features/bmr/calc`. */
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),

  // Auth — password is salted + stretched (see `@/lib/crypto`). Never store plaintext.
  passwordHash: text('password_hash').notNull(),
  passwordSalt: text('password_salt').notNull(),
  role: text('role').$type<UserRole>().notNull().default('user'),

  // Profile.
  displayName: text('display_name'),
  avatarUri: text('avatar_uri'),
  avatarColor: text('avatar_color'),

  // Body metrics — used to pre-fill the Harris–Benedict calculator and saved
  // back to the user "detail" on calculation. Latest snapshot only (no history yet).
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
/** The user object exposed to the UI — never carries the password material. */
export type PublicUser = Omit<User, 'passwordHash' | 'passwordSalt'>;

/** How often a reminder repeats. */
export type ReminderFrequency = 'daily' | 'weekly';

/**
 * Generic, reusable local reminders (weigh-ins, measurements, water, supplements,
 * …). A weekly reminder can fire on several days, so it maps to *one OS
 * notification per selected day* — `notificationIds` keeps them all so the set
 * can be cancelled/rescheduled on edit or toggle. `weekdays` (1=Sun … 7=Sat) is
 * only used when `frequency` is `weekly`; `hour` is always stored 24h (the
 * 12/24h choice is display-only). Both arrays are JSON-encoded TEXT.
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
 *     never mutates the shared template (offline, no sync until v2).
 *
 * Weeks are stored **routine-relative (1–4)**; the absolute program week is
 * derived from the routine's `order_index` + position. Suggested weights are
 * derived from `set_logs` history (no MMKV cache). All FKs are intentionally
 * loose text refs (matching the rest of the schema; expo-sqlite runs with
 * foreign_keys OFF) — referential cleanup is handled in repo code.
 * ──────────────────────────────────────────────────────────────────────────── */

export type ExerciseCategory =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'full_body'
  | 'cardio';
export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'other';

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
  },
  (t) => [index('idx_exercises_category').on(t.category), index('idx_exercises_name').on(t.name)],
);

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;

export type ProgramDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ProgramGoal = 'strength' | 'hypertrophy' | 'powerbuilding' | 'endurance';

export const programs = sqliteTable(
  'programs',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    durationWeeks: integer('duration_weeks'),
    difficulty: text('difficulty').$type<ProgramDifficulty>(),
    goal: text('goal').$type<ProgramGoal>(),
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
  },
  (t) => [index('idx_routines_program').on(t.programId)],
);

export type Routine = typeof routines.$inferSelect;
export type NewRoutine = typeof routines.$inferInsert;

/** A training day within a routine (e.g. "Push", "Pull", "Legs"). Was "face". */
export const workoutDays = sqliteTable(
  'workout_days',
  {
    id: text('id').primaryKey(),
    routineId: text('routine_id').notNull(),
    name: text('name').notNull(),
    focusMuscles: text('focus_muscles', { mode: 'json' }).$type<string[]>(),
    orderIndex: integer('order_index').notNull().default(0),
    userProgramId: text('user_program_id'),
    createdAt: tsMs('created_at').notNull().default(NOW_MS),
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
    userProgramId: text('user_program_id'),
  },
  (t) => [index('idx_workout_day_exercises_day').on(t.workoutDayId)],
);

export type WorkoutDayExercise = typeof workoutDayExercises.$inferSelect;
export type NewWorkoutDayExercise = typeof workoutDayExercises.$inferInsert;

/** How intensity for a week is expressed. `percentage` fills the %1RM gap. */
export type IntensityType = 'rir' | 'rpe' | 'percentage';

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
    reps: integer('reps').notNull(),
    rirMin: integer('rir_min'),
    rirMax: integer('rir_max'),
    toFailure: integer('to_failure', { mode: 'boolean' }).notNull().default(false),
    restSeconds: integer('rest_seconds'),
    intensityType: text('intensity_type').$type<IntensityType>().notNull().default('rir'),
    intensityValue: real('intensity_value'),
    userProgramId: text('user_program_id'),
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
    createdAt: tsMs('created_at').notNull().default(NOW_MS),
    updatedAt: tsMs('updated_at').notNull().default(NOW_MS),
  },
  (t) => [index('idx_user_programs_user').on(t.userId)],
);

export type UserProgram = typeof userPrograms.$inferSelect;
export type NewUserProgram = typeof userPrograms.$inferInsert;

export type WorkoutStatus = 'in_progress' | 'completed' | 'abandoned';

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
    createdAt: tsMs('created_at').notNull().default(NOW_MS),
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
  },
  (t) => [
    index('idx_set_logs_workout').on(t.workoutLogId),
    index('idx_set_logs_exercise').on(t.exerciseId),
  ],
);

export type SetLog = typeof setLogs.$inferSelect;
export type NewSetLog = typeof setLogs.$inferInsert;
