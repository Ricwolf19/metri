import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

/**
 * The local SQLite database — metri's offline-first source of truth.
 *
 * `enableChangeListener: true` is required for Drizzle's `useLiveQuery` to react
 * to writes, so the UI stays in sync with the database without a global store.
 */
export const sqlite = openDatabaseSync('metri.db', {
  enableChangeListener: true,
});

export const db = drizzle(sqlite, { schema });

export { schema };
