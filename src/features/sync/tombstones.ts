import { db } from '@/db/client';
import { syncDeletions } from '@/db/schema';
import { randomId } from '@/lib/crypto';

import type { SyncTable } from './tables';

/**
 * Record that a syncable row was deleted, so the next push can propagate the
 * removal instead of the server re-sending it on pull. Called from repo delete
 * sites right after the hard delete.
 */
export const recordDeletion = (table: SyncTable, ids: string | string[]): void => {
  const list = Array.isArray(ids) ? ids : [ids];
  for (const rowId of list) {
    if (!rowId) continue;
    db.insert(syncDeletions).values({ id: randomId(), tableName: table, rowId }).run();
  }
};
