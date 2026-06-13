import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
