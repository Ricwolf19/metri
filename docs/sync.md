# Premium sync — mobile side (engine + UI)

This document covers the **app half** of metri's premium sync: when it runs,
how local changes are found and pushed, how remote rows are pulled and applied
to SQLite, where the bookmarks live, and what the UI shows. The **server half**
(endpoints, validation, the `sync_row` mirror, limits, server guarantees) lives
in the web repo:

> **Server companion doc:**
> [`Ricwolf19/metri.info` → `docs/sync.md`](https://github.com/Ricwolf19/metri.info/blob/main/docs/sync.md)

Start with the glossary if terms like _cursor_ or _watermark_ are new — the
rest of the doc uses them freely.

## Glossary

| Term                      | Meaning here                                                                                                                                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Offline-first**         | SQLite on the device is the source of truth. The app never waits on the network to read or write; sync happens _after_ the fact, in the background.                                                                          |
| **Delta sync**            | Moving only what changed since the last cycle, in both directions, instead of re-sending everything every time.                                                                                                              |
| **Push**                  | Sending local changes (edits + deletions) up to the server.                                                                                                                                                                  |
| **Pull**                  | Asking the server for rows changed since our cursor and applying them locally.                                                                                                                                               |
| **Watermark**             | The push-direction bookmark: the highest local change-timestamp (epoch ms) that has already been pushed. Next push only gathers rows whose change time is greater. Stored per user in MMKV (`state.ts`).                     |
| **Cursor**                | The pull-direction bookmark: the server's ISO timestamp from the last pull. Next pull asks "everything after this". Also per user in MMKV. The server keeps no per-device state — this app carries its own position.         |
| **Tombstone**             | A "this row was deleted" record. Deleting locally just removes the row, so `sync_deletions` records the deletion and the next push propagates it; otherwise the server would re-send the row on pull and it would resurrect. |
| **LWW (Last-Write-Wins)** | The conflict rule: when the same row was edited on two devices, the newer client `updatedAt` wins — applied by the server on push and by this app on pull.                                                                   |

## Technologies

| Piece                                         | Role                                                                                                                              |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| expo-sqlite (raw SQL)                         | The engine reads/writes rows as raw column maps so values round-trip byte-for-byte — no Date/boolean/json mapping layer.          |
| MMKV (`src/lib/storage.ts`)                   | Watermark + cursor, synchronous, namespaced per user id.                                                                          |
| Better Auth client                            | Supplies the session cookie both endpoints require.                                                                               |
| `fetch` → `/api/sync/push` & `/api/sync/pull` | The whole wire protocol. JSON bodies, described in the server doc.                                                                |
| `useSyncExternalStore` (`status.ts`)          | Publishes engine state to the UI without a context — `TopBar` renders on ~25 screens and the engine publishes from outside React. |

## Files

All in `src/features/sync/`:

| File              | Responsibility                                                                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `engine.ts`       | `syncNow(userId)` — the full push→pull cycle.                                                                                                                           |
| `tables.ts`       | `SYNC_TABLES`: which tables sync, **in parent-before-child order**. Mirrors `SYNC_TABLES` in the web repo's `lib/sync/contract.ts` — adding a table means editing both. |
| `state.ts`        | Watermark + cursor storage (MMKV, per user) + the install's device id.                                                                                                  |
| `tombstones.ts`   | `recordDeletion(table, ids)` — called from repo delete sites right after the hard delete.                                                                               |
| `status.ts`       | The tiny observable store for the sync state machine.                                                                                                                   |
| `useSyncState.ts` | React subscription to that store.                                                                                                                                       |
| `useAutoSync.ts`  | When cycles run. Mounted once in `(tabs)/_layout.tsx`.                                                                                                                  |
| `SyncRing.tsx`    | The avatar ring — the only user-facing signal.                                                                                                                          |

## When sync runs

`useAutoSync` — premium only, no button, no toggle. A cycle fires:

- on mount (app launch into the signed-in shell),
- on every foreground (`AppState` → `active`),
- when connectivity comes back (`expo-network` listener) — the common case:
  logging sets offline at the gym, walking out into signal without ever
  backgrounding the app.

A `busy` ref makes cycles non-overlapping, and two throttles keep event storms
from becoming request storms:

- **Cooldown (60s):** foreground/network events fire far more often than data
  changes (Android emits network-state flaps constantly). An idle cycle inside
  the window is skipped — but `hasLocalChanges()` (a cheap local check) jumps
  the queue, so a set logged offline still syncs the moment signal returns.
- **Error backoff:** after a failure, retries wait 30s, 1m, 2m … capped at 5m,
  instead of re-firing on every flap. This is what stopped the ring from
  flashing red/blue in a loop while hammering the API.

Without the `sync` entitlement the hook sets state `off` and never runs — gate
with `can(plan, 'sync')`, never `plan === 'premium'`.

## The cycle (`syncNow`)

```
gather owned rows changed since watermark ─▶ POST /push ─▶ advance watermark,
                                                           delete pushed tombstones
                        ┌──────────────────────────────────────────┘
                        ▼
        POST /pull (since cursor) ─▶ applyRow × page ─▶ store new cursor
                        ▲                                        │
                        └────────── while hasMore (≤ 20 pages) ──┘
```

### 1. Push

- **Ownership filter** (`ownedIds`): only the user's rows leave the device —
  custom exercises/programs, any enrolled-copy tree, and the user's
  logs/sets/enrollments/adherence. Seeded/shared content never syncs.
- **Change detection** is per table via `CHANGE_TS` — `COALESCE(updated_at,
created_at)` (some tables lack one of them) compared against the watermark.
- Deletions ride along from `sync_deletions`.
- Both requests carry the **device id**, which the server stores as `origin`;
  pulls then exclude this device's own rows — without that, every push came
  straight back on the next pull (thousands of redundant rows per cycle).
- Only after the server confirms (`res.ok`) does the app **advance the
  watermark** and delete the pushed tombstones. A failed push leaves both
  intact, so nothing is ever marked "sent" that didn't land — this is why the
  server applies the whole push atomically (see the server doc's "Neon driver
  constraint").

### 2. Pull

- Pages of up to 500 rows, drained until `hasMore` clears, capped at
  `MAX_PULL_PAGES = 20` per cycle — the cursor is persisted after each page, so
  a huge history just resumes on the next run.
- The loop breaks if the cursor doesn't advance (guards a full page landing
  inside one millisecond — re-serving is harmless, looping isn't).

### 3. Apply (`applyRow`) — the invariants

Every one of these guards was a real bug:

1. **Each row applies in its own try/catch.** One unappliable row must not
   abort the page — that used to strand the cursor before it was stored, so
   every later run re-fetched and re-failed the same page: a silent,
   permanently dead sync.
2. **Incoming keys are intersected against `PRAGMA table_info`.** Pulled rows
   carry whatever keys the server mirror holds (opaque jsonb — the server can't
   validate them). The intersection means a row from a newer app version
   doesn't throw `no such column` on an older device, and a crafted key isn't a
   SQL-injection primitive.
3. **Secondary unique indexes need `EXTRA_UNIQUE`.** `on conflict(id)` doesn't
   cover a table with another unique index (`training_days` on
   `(user_id, date)`): two devices can create the same logical row under
   different ids. The apply clears the local squatter first — inside a SQLite
   transaction with the insert, and only after its own LWW check, so an older
   remote row can't destroy a newer local one.
4. **LWW on apply:** the local row is kept when it is strictly newer than the
   incoming one.
5. The local DB runs with `foreign_keys OFF`, and `SYNC_TABLES` is ordered
   parents-first, so apply order never blocks on a missing parent.

## UI — the sync indicators

The **ring around the avatar** (`SyncRing`, wrapping `Avatar` inside `TopBar`)
is the _only_ user-facing signal. Failures never toast — a flaky gym connection
would be noise. States (`status.ts`):

| State     | Ring                | Meaning                                                            |
| --------- | ------------------- | ------------------------------------------------------------------ |
| `off`     | hidden              | Not premium or signed out. The ring doubles as the premium marker. |
| `offline` | gray, steady        | No connectivity; local writes keep queueing.                       |
| `syncing` | sky blue, breathing | A cycle is in flight.                                              |
| `synced`  | lime, steady        | Everything local has reached the server.                           |
| `error`   | red, breathing      | The last cycle failed _while online_ (server rejected us).         |

`useAutoSync` distinguishes `offline` from `error` by asking `expo-network`
after a failure — only "the server rejected us" is worth showing as an error.

## What is NOT synced

Progress photos (local file paths and files stay on the device), reminders
(OS-scoped notification handles), and the `users` row (`plan` must not be
client-writable). Full rationale in the
[server doc](https://github.com/Ricwolf19/metri.info/blob/main/docs/sync.md).

## Rules when touching synced tables

- **Synced column names are a wire format: add, never rename.** Old rows keep
  old keys in the server's jsonb forever; there is no server-side migration.
- Adding a synced table = `tables.ts` here **and** `SYNC_TABLES` in the web
  repo's `lib/sync/contract.ts`, keeping parent-before-child order.
- A new table with a secondary unique index **must** be added to
  `EXTRA_UNIQUE` in `engine.ts`.
- Every repo delete site for a synced table must call `recordDeletion` right
  after the hard delete.
