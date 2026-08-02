import { sqlite } from '@/db/client';
import { authClient } from '@/features/auth/auth-client';
import { API_URL } from '@/lib/env';

import { getCursor, getDeviceId, getPushWatermark, setCursor, setPushWatermark } from './state';
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

/** Pull pages to drain per cycle. The cursor is persisted after each page, so
 * hitting this ceiling just means the rest lands on the next run. */
const MAX_PULL_PAGES = 20;
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

/** Real column names per table, read once from SQLite itself.
 *
 * Pulled rows carry whatever keys the *server* mirror holds, and the mirror is
 * opaque jsonb — the server cannot validate them. Interpolating those keys into
 * SQL unchecked meant two things: a row written by a newer app version (extra
 * column) threw `no such column` on older devices, and a crafted key was a SQL
 * injection primitive pointed at the device. Intersecting against the live
 * schema fixes both, and self-maintains as migrations land. */
const columnCache = new Map<string, Set<string>>();
const tableColumns = (table: SyncTable): Set<string> => {
  const hit = columnCache.get(table);
  if (hit) return hit;
  const rows = sqlite.getAllSync(`pragma table_info(${table})`) as { name: string }[];
  const cols = new Set(rows.map((c) => c.name));
  columnCache.set(table, cols);
  return cols;
};

/** Uniqueness a table enforces *beyond* its primary key.
 *
 * `on conflict(id)` doesn't cover these: two devices can create the same
 * logical training day with different random ids, so the incoming row collides
 * on `(user_id, date)` rather than on `id`, and the insert throws. SQLite allows
 * only one conflict target per statement, so the fix is to clear the local
 * squatter first — LWW has already decided the remote row wins by this point. */
const EXTRA_UNIQUE: Partial<Record<SyncTable, string[]>> = {
  training_days: ['user_id', 'date'],
};

const applyRow = (r: PulledRow): void => {
  if (!(SYNC_TABLES as readonly string[]).includes(r.table)) return;
  const table = r.table as SyncTable;
  if (r.deleted) {
    sqlite.runSync(`delete from ${table} where id = ?`, [r.id]);
    return;
  }
  if (!r.data) return;
  // Last-Write-Wins: keep the local row if it's strictly newer.
  const ts = CHANGE_TS[table];
  const local = sqlite.getFirstSync(`select (${ts}) as __ts from ${table} where id = ?`, [
    r.id,
  ]) as Row | null;
  if (local && Number(local.__ts) > r.updatedAt) return;

  const valid = tableColumns(table);
  const cols = Object.keys(r.data).filter((c) => valid.has(c));
  if (!cols.length) return;

  const updates = cols
    .filter((c) => c !== 'id')
    .map((c) => `${c}=excluded.${c}`)
    .join(',');

  // Delete-then-insert must be atomic: the pull loop swallows per-row errors, so
  // a failed insert after a committed delete would silently destroy the local
  // row with nothing to replace it.
  sqlite.withTransactionSync(() => {
    const unique = EXTRA_UNIQUE[table];
    if (unique && unique.every((c) => c in r.data!)) {
      const where = unique.map((c) => `${c} = ?`).join(' and ');
      const args = [...unique.map((c) => r.data![c] as never), r.id];
      // The LWW check above matched on `id`, which by definition can't find a
      // squatter holding the same secondary key under a *different* id — so it
      // gets its own comparison. Without this, an older remote row silently
      // destroyed a newer local one.
      const squatter = sqlite.getFirstSync(
        `select (${ts}) as __ts from ${table} where ${where} and id <> ?`,
        args,
      ) as Row | null;
      if (squatter && Number(squatter.__ts) > r.updatedAt) return;
      sqlite.runSync(`delete from ${table} where ${where} and id <> ?`, args);
    }

    sqlite.runSync(
      `insert into ${table} (${cols.join(',')}) values (${holes(cols.length)}) ` +
        `on conflict(id) do update set ${updates}`,
      cols.map((c) => r.data![c] as never),
    );
  });
};

/** Anything queued locally (changed rows or tombstones)? Local-only reads, so
 * it is cheap enough for the auto-sync hook to call before every cycle — a
 * pending local write bypasses the cooldown, an idle app respects it. */
export const hasLocalChanges = (userId: string): boolean => {
  if (all('select id from sync_deletions where pushed_at is null limit 1').length > 0) return true;
  return gatherChanges(userId, getPushWatermark(userId)).changes.length > 0;
};

/** Run a full push→pull cycle for the signed-in premium user. */
export const syncNow = async (userId: string): Promise<{ pushed: number; pulled: number }> => {
  const cookie = authClient.getCookie();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;
  // Identifies this install so the server can keep our own writes out of our
  // pulls — without it, every push came straight back on the next pull.
  const deviceId = getDeviceId();

  // 1) PUSH local changes + tombstones.
  const watermark = getPushWatermark(userId);
  const { changes, maxTs } = gatherChanges(userId, watermark);
  const deletions = gatherDeletions();
  if (changes.length || deletions.length) {
    const res = await fetch(`${API_URL}/api/sync/push`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        deviceId,
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

  // 2) PULL remote changes since the cursor, one page at a time.
  //
  // The server caps a page (LIMITS.pullPage) and reports `hasMore`; ignoring it
  // left a big history converging one page per app-foreground, with a partially
  // populated database in between. MAX_PAGES bounds a single cycle so a pathological
  // history can't spin forever — the next run resumes from the stored cursor.
  let pulled = 0;
  for (let page = 0; page < MAX_PULL_PAGES; page++) {
    const since = getCursor(userId);
    const res = await fetch(`${API_URL}/api/sync/pull`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ since, deviceId }),
    });
    if (!res.ok) throw new Error(`pull failed (${res.status})`);
    const { rows, cursor, hasMore } = (await res.json()) as {
      rows: PulledRow[];
      cursor: string | null;
      hasMore?: boolean;
    };

    // Per row, so one unappliable row can't abort the page and strand the
    // cursor — that turned a single bad row into a permanently dead sync,
    // because every later run re-fetched and re-failed on the same page.
    for (const row of rows) {
      try {
        applyRow(row);
      } catch {
        // Skipped rows are re-sent on the next server-side change to them.
      }
    }
    pulled += rows.length;
    // Guard against a cursor that can't advance. The server stores microsecond
    // precision but the cursor is an ISO string (milliseconds), so a full page
    // landing inside one millisecond would be re-served forever. Re-serving is
    // harmless on its own — applying is idempotent — but looping isn't.
    if (cursor === since) break;
    if (cursor) setCursor(userId, cursor);
    if (!hasMore || !rows.length) break;
  }

  return { pushed: changes.length + deletions.length, pulled };
};
