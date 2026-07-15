/**
 * The tables whose user-owned rows sync to Neon (premium). Order matters for
 * apply: parents before children, so a pulled child never references a row that
 * hasn't landed yet. Seeded/shared content (exercises & programs with a null
 * `userId`, template tree rows) is excluded by the engine's ownership filters.
 * Names match the SQLite table names — the engine addresses them via raw SQL.
 */
export const SYNC_TABLES = [
  'exercises',
  'programs',
  'routines',
  'workout_days',
  'workout_day_exercises',
  'week_configs',
  'user_programs',
  'workout_logs',
  'set_logs',
  'training_days',
] as const;

export type SyncTable = (typeof SYNC_TABLES)[number];
