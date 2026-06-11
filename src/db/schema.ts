import { sql } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Drizzle schema (SQLite — the on-device source of truth).
 *
 * This file currently holds only infrastructure plumbing. The domain model
 * (exercises, workouts, sets, body metrics, ...) is intentionally deferred and
 * will be designed in a later iteration. `app_meta` exists so the migration
 * pipeline is wired end to end and the database initializes on first launch.
 */
export const appMeta = sqliteTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value'),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

export type AppMeta = typeof appMeta.$inferSelect;
