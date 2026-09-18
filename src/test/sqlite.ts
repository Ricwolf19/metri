import { drizzle } from 'drizzle-orm/sql-js';
import { migrate } from 'drizzle-orm/sql-js/migrator';
import initSqlJs from 'sql.js';

import * as schema from '@/db/schema';

/** In-memory sql.js SQLite with the real migrations; same sync Drizzle API as the expo driver,
 * so repo code runs unchanged when tests mock `@/db/client` with it. */
export const createTestDb = async () => {
  const SQL = await initSqlJs();
  const sqlite = new SQL.Database();
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  return db;
};
