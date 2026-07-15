import { sqlite } from '@/db/client';
import { authClient } from '@/features/auth/auth-client';
import { API_URL } from '@/lib/env';

import { getCursor, getPushWatermark, setCursor, setPushWatermark } from './state';
import { SYNC_TABLES, type SyncTable } from './tables';

/**
 * The premium delta-sync engine (SQLite ↔ Neon). Rows are moved as opaque raw
 * column maps so values round-trip byte-for-byte (no Date/boolean/json mapping):
 * gather local changes since the push watermark → POST /push → pull since the
 * cursor → apply with Last-Write-Wins. Raw SQL throughout; the local DB runs
 * with foreign_keys OFF so apply order never blocks on a missing parent.
 */

type Row = Record<string, unknown>;

/** Per-table "content changed at" expression (ms). Some tables lack created_at. */
const CHANGE_TS: Record<SyncTable, string> = {
  exercises: 'COALESCE(updated_at, created_at)',
  programs: 'COALESCE(updated_at, created_at)',
  routines: 'COALESCE(updated_at, created_at)',
  workout_days: 'COALESCE(updated_at, created_at)',
  workout_day_exercises: 'updated_at',
  week_configs: 'updated_at',
  user_programs: 'COALESCE(updated_at, created_at)',
  workout_logs: 'COALESCE(updated_at, created_at)',
  set_logs: 'COALESCE(updated_at, created_at)',
  training_days: 'COALESCE(updated_at, created_at)',
};

const idsOf = (rows: Row[]): string[] => rows.map((r) => r.id as string);
const holes = (n: number): string => Array.from({ length: n }, () => '?').join(',');
const all = (source: string, params: unknown[] = []): Row[] =>
  sqlite.getAllSync(source, params as never) as Row[];

/**
 * The row ids the user owns per table (everything that isn't shared seed
 * content). The local DB holds only this user's data + seeds, so ownership is:
 * custom exercises/programs, any enrolled-copy tree (`user_program_id` set) or
 * custom-program tree, and the user's logs/sets/enrollments/adherence.
 */
const ownedIds = (userId: string): Record<SyncTable, string[]> => {
  const customPrograms = idsOf(all('select id from programs where is_custom = 1'));
  const routineIds = idsOf(
    all(
      `select id from routines where user_program_id is not null${
        customPrograms.length ? ` or program_id in (${holes(customPrograms.length)})` : ''
      }`,
      customPrograms,
    ),
  );
  const dayIds = routineIds.length
    ? idsOf(
        all(
          `select id from workout_days where routine_id in (${holes(routineIds.length)})`,
          routineIds,
        ),
      )
    : [];
  const slotIds = dayIds.length
    ? idsOf(
        all(
          `select id from workout_day_exercises where workout_day_id in (${holes(dayIds.length)})`,
          dayIds,
        ),
      )
    : [];
  const configIds = slotIds.length
    ? idsOf(
        all(
          `select id from week_configs where workout_day_exercise_id in (${holes(slotIds.length)})`,
          slotIds,
        ),
      )
    : [];
  const logIds = idsOf(all('select id from workout_logs where user_id = ?', [userId]));
  const setIds = logIds.length
    ? idsOf(
        all(`select id from set_logs where workout_log_id in (${holes(logIds.length)})`, logIds),
      )
    : [];

  return {
    exercises: idsOf(all('select id from exercises where is_custom = 1')),
    programs: customPrograms,
    routines: routineIds,
    workout_days: dayIds,
    workout_day_exercises: slotIds,
    week_configs: configIds,
    user_programs: idsOf(all('select id from user_programs where user_id = ?', [userId])),
    workout_logs: logIds,
    set_logs: setIds,
    training_days: idsOf(all('select id from training_days where user_id = ?', [userId])),
  };
};

type Change = { table: SyncTable; id: string; updatedAt: number; data: Row };

const gatherChanges = (userId: string, watermark: number): { changes: Change[]; maxTs: number } => {
  const owned = ownedIds(userId);
  const changes: Change[] = [];
  let maxTs = watermark;
  for (const table of SYNC_TABLES) {
    const ids = owned[table];
    if (!ids.length) continue;
    const ts = CHANGE_TS[table];
    const rows = all(
      `select *, (${ts}) as __ts from ${table} where id in (${holes(ids.length)}) and (${ts}) > ?`,
      [...ids, watermark],
    );
    for (const row of rows) {
      const changeTs = Number(row.__ts);
      delete row.__ts;
      changes.push({ table, id: row.id as string, updatedAt: changeTs, data: row });
      if (changeTs > maxTs) maxTs = changeTs;
    }
  }
  return { changes, maxTs };
};

type Tombstone = { tombstoneId: string; table: string; id: string; deletedAt: number };

const gatherDeletions = (): Tombstone[] =>
  all('select id, table_name, row_id, deleted_at from sync_deletions where pushed_at is null').map(
    (r) => ({
      tombstoneId: r.id as string,
      table: r.table_name as string,
      id: r.row_id as string,
      deletedAt: Number(r.deleted_at),
    }),
  );

type PulledRow = {
  table: string;
  id: string;
  data: Row | null;
  deleted: boolean;
  updatedAt: number;
};

const applyRow = (r: PulledRow): void => {
  if (!(SYNC_TABLES as readonly string[]).includes(r.table)) return;
  if (r.deleted) {
    sqlite.runSync(`delete from ${r.table} where id = ?`, [r.id]);
    return;
  }
  if (!r.data) return;
  // Last-Write-Wins: keep the local row if it's strictly newer.
  const ts = CHANGE_TS[r.table as SyncTable];
  const local = sqlite.getFirstSync(`select (${ts}) as __ts from ${r.table} where id = ?`, [
    r.id,
  ]) as Row | null;
  if (local && Number(local.__ts) > r.updatedAt) return;

  const cols = Object.keys(r.data);
  const updates = cols
    .filter((c) => c !== 'id')
    .map((c) => `${c}=excluded.${c}`)
    .join(',');
  sqlite.runSync(
    `insert into ${r.table} (${cols.join(',')}) values (${holes(cols.length)}) ` +
      `on conflict(id) do update set ${updates}`,
    cols.map((c) => r.data![c] as never),
  );
};

/** Run a full push→pull cycle for the signed-in premium user. */
export const syncNow = async (userId: string): Promise<{ pushed: number; pulled: number }> => {
  const cookie = authClient.getCookie();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;

  // 1) PUSH local changes + tombstones.
  const watermark = getPushWatermark(userId);
  const { changes, maxTs } = gatherChanges(userId, watermark);
  const deletions = gatherDeletions();
  if (changes.length || deletions.length) {
    const res = await fetch(`${API_URL}/api/sync/push`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        changes,
        deletions: deletions.map((d) => ({ table: d.table, id: d.id, deletedAt: d.deletedAt })),
      }),
    });
    if (!res.ok) throw new Error(`push failed (${res.status})`);
    setPushWatermark(userId, maxTs);
    if (deletions.length) {
      const tIds = deletions.map((d) => d.tombstoneId);
      sqlite.runSync(`delete from sync_deletions where id in (${holes(tIds.length)})`, tIds);
    }
  }

  // 2) PULL remote changes since the cursor.
  const since = getCursor(userId);
  const res = await fetch(`${API_URL}/api/sync/pull`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ since }),
  });
  if (!res.ok) throw new Error(`pull failed (${res.status})`);
  const { rows, cursor } = (await res.json()) as { rows: PulledRow[]; cursor: string | null };
  for (const row of rows) applyRow(row);
  if (cursor) setCursor(userId, cursor);

  return { pushed: changes.length + deletions.length, pulled: rows.length };
};
