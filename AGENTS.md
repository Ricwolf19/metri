# AGENTS.md

## What this is

**metri** — offline-first workout tracker (Expo SDK 56, RN 0.85, TypeScript strict, Bun). Native
modules (MMKV, notifications) → runs on a **development build**, never Expo Go. An account is
required (Better Auth against the metri.info backend; `src/app/index.tsx` is the gate). Cloud sync
is Premium-only and automatic. Longer overview, Android JDK-17 setup and the CI/release walkthrough
live in `README.md`; the sync protocol lives in `docs/sync.md` (mobile half) and the web repo's
`docs/sync.md` (server half).

## Commands

```bash
bun start              # Metro dev server
bun run android|ios    # native build + run (Android needs JDK 17 — README)
bun run verify         # format:check + lint + typecheck + test + i18n:check + deadcode
bun run ci             # verify + secrets:scan + expo-doctor — mirror of CI; pre-push runs this
bun run test           # vitest — colocated *.test.ts, pure logic only (no RN imports)
bun run db:generate    # regenerate SQL migrations after editing src/db/schema.ts
```

A knip or i18n:check finding FAILS the gate: delete/unexport dead code, remove orphaned dictionary
keys. Every production bug fix ships with the test that would have caught it.

## Architecture invariants

- **The database drives the UI.** SQLite is the source of truth; screens react via Drizzle
  `useLiveQuery` (works because `db/client.ts` sets `enableChangeListener: true`). No
  Zustand/Redux/TanStack Query.
- **MMKV (`src/lib/storage.ts`) is for small hot-path key-values only** (settings, flags, sync
  bookmarks) — it never replaces SQLite.
- **Migrations**: edit `src/db/schema.ts` → `bun run db:generate` → generated SQL in
  `src/db/migrations/` (never hand-edit) applies on next launch; `_layout.tsx` gates the app on it.
- **Typed routes** are generated into gitignored `.expo/types/` — after adding/renaming a route,
  run `bun start` once or typecheck fails against the stale cache.
- **No credential material on the device.** Passwords live only with Better Auth on the server; the
  local `users` row is an identity mirror. The email is server-owned — never editable locally
  (a diverged email would duplicate the mirror row on revalidation).
- **Entitlements**: gate with `can(plan, feature)` (`features/auth/entitlements.ts`), never
  `plan === 'premium'`.
- **Privacy claims are code.** "Photos and reminders never leave the device" must stay true and in
  sync with `src/features/legal/content.ts` whenever sync or telemetry changes. All Sentry access
  goes through `src/lib/telemetry.ts` (account id only, `sendDefaultPii: false`, empty DSN = off) —
  never import `@sentry/react-native` elsewhere.
- **Animations** use built-in RN `Animated` (no reanimated worklets plugin is wired).

## Sync (Premium) — the rules that were real bugs

Read `docs/sync.md` before touching `src/features/sync/`. Non-negotiables:

- Every `applyRow` is individually try/caught — one bad row must never strand the cursor.
- Incoming keys are intersected against `PRAGMA table_info` (schema drift + SQL-injection guard).
- A table with a secondary unique index needs an `EXTRA_UNIQUE` entry in `engine.ts`.
- Adding a synced table = `tables.ts` here **and** `SYNC_TABLES` in the web repo's
  `lib/sync/contract.ts`. Synced column names are a wire format: **add, never rename.**
- Repo delete sites for synced tables must call `recordDeletion` right after the hard delete.
- Failures are silent by design — the avatar ring is the only user-facing signal.

## Conventions

- **Arrow functions everywhere** (ESLint-enforced); default-export screens as
  `const Screen = () => {}; export default Screen;`.
- Imports via `@/` (src) and `@/assets/*`. SVGs import as components; `.sql` imports are wired in
  metro/babel config — don't remove that config.
- **NativeWind tokens, never raw hex** in components: `ink-*`/`accent` adapt per theme; `ink-950`
  stays constant; accent text = `text-accent`, accent fills = `bg-lime-400`; icon `color=` props use
  `useTheme()` values. Icons come from the `@/components/icons` Iconoir barrel — add by mapping
  there, don't import `iconoir-react-native` in screens.
- **i18n**: flat dotted keys in `src/i18n/{en,es}.ts` — add to BOTH (tsc + `i18n:check` enforce).
- Conventional Commits (commitlint); husky runs lint-staged pre-commit and `bun run ci` pre-push.

## CI & release (sideloaded beta — no store pushes a binary for you)

Full walkthrough in `README.md` → "CI & Release Pipeline". Breakable rules:

- Never pass `--output` to a cloud `eas build`; the APK job resolves the artifact via `--json`.
- OTA publishes with `--channel beta`, never `--auto`. The build profile stays named `preview` —
  profile and channel names are independent.
- `runtimeVersion` = `fingerprint` policy + `fingerprint.config.js` (skips `ExpoConfigVersions` and
  `ExpoConfigExtraSection`). Don't revert to `appVersion`, don't delete the config — either strands
  every install from OTA.
- `app.config.ts` fails safe to the production API URL (dev URL only under
  `NODE_ENV === 'development'`); `eas.json`/workflows pin `EXPO_PUBLIC_AUTH_URL` on top.
- The `apk-beta` release tag and `metri.apk` asset name are hard-coded by metri.info — never rename.
- Versions (`package.json`, `CHANGELOG.md`, `app.json → expo.version`) are release-please's; never
  bump by hand.
