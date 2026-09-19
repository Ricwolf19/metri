# AGENTS.md

## What this is

**metri** — offline-first workout tracker (Expo SDK 57, RN 0.86, TypeScript strict, Bun). Native
modules (MMKV, notifications) → runs on a **development build**, never Expo Go. Accounts are
OPTIONAL: `users.authKind` separates device-only rows ('local') from Better Auth mirrors
('remote'); `src/app/index.tsx` gates on any user row existing. A later sign-in ADOPTS the local
row in place (same id — `adoptLocalUser`); never create a second row for the same person.
Local users must never hit the network (`revalidate`/`pushProfile` early-return). Export/import
(`src/features/plan/`) is **unconditional** — local users included. Sync is the only paid
capability; nothing may ever gate a user out of their own data. Import is additive: every id is
regenerated (FKs rewritten, including inside JSON payloads), ownership is forced to the importer,
`updatedAt` is stamped so sync pushes the rows, and a repeated import duplicates rather than
merges. `EXPORT_VERSION` 3 adds export-only `progressPhotos` metadata (never the file paths);
`validate-import.ts` accepts 2 and 3. Cloud sync is
Premium-only and automatic. `README.md` is the presentation card only; the long-form docs live in
`docs/`: `android-setup.md` (JDK 17, reset, wireless), `release.md` (CI/release walkthrough),
`sync.md` (protocol, mobile half — server half in the web repo's `docs/sync.md`), `brand.md`.

## Layout

```
src/app/         Expo Router screens: (auth), (tabs), training/{program,start,edit,workout},
                 analytics, plan, profile…
src/components/  ui/ (shared primitives — import from the barrel), icons/ (Iconoir barrel), TopBar
src/db/          schema.ts, client.ts, migrations/ (generated)
src/features/    training (repos, schedule, editors' components, analytics engine), auth, sync,
                 plan (export/import), body (body_metrics), notifications, calculators, widget,
                 legal, home, explore, docs (content/{en,es}/*)
src/i18n/        en.ts + es.ts (flat keys), provider
src/lib/         storage (MMKV), date helpers, telemetry, small hooks (useDateFormat, useTodayKey…)
src/test/        sql.js harness for repo tests
docs/            android-setup, release, sync, brand (long-form docs; README stays short)
```

## Commands

```bash
bun start              # Metro dev server
bun run android|ios    # native build + run (Android needs JDK 17 — docs/android-setup.md)
bun run verify         # format:check + lint + typecheck + test + i18n:check + deadcode
bun run ci             # verify + secrets:scan + expo-doctor — mirror of CI; pre-push runs this
bun run test           # vitest — colocated *.test.ts: pure logic, or repos against src/test/sqlite.ts (sql.js) with `@/db/client` + `@/lib/crypto` mocked
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
- **Animations** use `react-native-reanimated` v4 (shared values + `useAnimatedStyle`; worklets
  wired via babel-preset-expo). React Compiler rules apply: write `.value` only in effects or
  module-scope factories, and before `useAnimatedStyle` captures the value.

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
- **Server/technical strings never reach the UI.** A caught error shows a translated message and
  goes to `captureError` (`lib/telemetry.ts`); raw API text is EN-only and leaks internals.
- **Screens**: navbar via `Screen`'s `header` slot (`<TopBar>`, floating pill). Tab screens:
  `<TopBar menu showFaq showBeta />` + `<ScreenTitle>` as the first content block. Nested screens:
  `<TopBar showBack showAvatar={false} title subtitle />` and no `ScreenTitle` (training is
  migrated; other nested screens follow).
- **Editors** buffer a draft + `dirty`, persist structure (add/delete/reorder) immediately, and
  guard leaving with `useUnsavedGuard` (Save & leave / Discard / Cancel). Every irreversible action
  is a `<HoldButton>` (press-and-hold) — inline and inside dialogs (`style: 'destructive'` renders
  one). Toasts only for save/delete/start/abandon.
- **Motion**: no springs, no bounce. Dialogs only fade (the Modal's own fade); sheets are `<Sheet>` on
  `@gorhom/bottom-sheet` with timing configs (drag down closes, `snapPoints` + `expandable` let the
  handle toggle full view); press feedback is a 110ms timing. Bounded lists that may overflow use
  `<ScrollArea>` so the edge chevron hints there is more — inside a sheet it MUST be
  `<ScrollArea inSheet>` (a plain ScrollView never receives the drag).
- **Dates** render through `useDateFormat()` (user preset in Settings), never `toLocaleDateString`
  in a screen. Storage keys stay 'YYYY-MM-DD'.
- **Section headers** are `<SectionLabel label hint>`; the hint always stacks below the label (a
  label + hint on one `justify-between` row overflows in ES).
- **Text on any device**: never a hard `h-*` on a container that holds text (use `min-h-*` and let
  it grow — ES copy runs ~20% longer than EN and phones differ in font/display scale). One-line
  labels clamp with `numberOfLines={1}`; body copy that may overflow uses `<ClampedText>` (measured
  "Read more", expands or navigates); tappable knowledge is a `<TextLink>` (lime underline, same
  look as markdown links). Controls cap the OS font multiplier with
  `maxFontSizeMultiplier={CONTROL_FONT_SCALE}` (`components/ui/typography.ts`); body copy never.
- **Docs markdown** (`features/docs/markdownStyles.ts`) must override every block the library
  styles by default (`fence`, `code_block`, `code_inline`, `link`…) — its defaults are light-theme
  hex that leak through. Formula blocks are one short line per formula, no column alignment.
- **Rest timer** state is MMKV (`features/training/rest-state.ts`), so it survives leaving the
  screen and the process; `features/notifications/rest-notification.ts` is the only module
  importing `react-native-notify-kit` (Android: OS-drawn countdown + Skip/+30 s/+1 min actions;
  the rest-over trigger shares the notification id so it replaces the countdown). Action presses
  can arrive headless — `index.js` registers the background handler — so those paths touch only
  MMKV and notifee. Scheduled reminders stay on `expo-notifications` (`service.ts`).
- **Program schedule** (weekday + start minute) lives on `workout_days` of the ENROLLED copy only;
  templates stay NULL. It is assigned in `/training/start/[id]` and `enrollInProgram` refuses an
  incomplete schedule or a tree that fails `validateProgramForStart`.
- **Weekdays are expo-numbered (1=Sun…7=Sat)** in every column and API (`workout_days.weekday`,
  `user_programs.training_weekdays`, notification schedules, `WeekdayChips`); Monday-first display
  order comes only from `DAY_ORDER` in `features/training/labels.ts`.
- **Adherence colours** come from `features/training/adherence-colors.ts` (brand = trained, red-500 +
  near-black = missed, gray = rest) for the calendar, the week strip and the day sheet — never inline.
- **Adherence follows the schedule.** Only PLANNED weekdays (`training_weekdays`, re-derived by
  `refreshTrainingWeekdays` from the current phase) can break a streak or raise the catch-up banner;
  unlogged unplanned days are neutral, and with no schedule every unlogged day breaks. Finishing a
  workout marks the day; manual marking in the Day Detail sheet is the fallback for any past date.
- **Warm-up sets** are `set_logs.isWarmup` rows logged from the same screen. Every read path
  excludes them — volume, PRs, e1RM, progression and the muscle models — so a new aggregate must
  filter them too. They never start the prescribed rest and carry no RIR (submaximal by
  definition); `warmup.ts` only suggests the ramp, the lifter still confirms each row.
- **Analytics.** Two muscle vocabularies coexist on purpose (`features/training/muscles.ts`):
  `MUSCLES` (coarse) is what a user tags a day with and is STORED in
  `workout_days.focus_muscles` — changing it drops user data; `MUSCLE_HEADS` (fine, ~19) is what an
  exercise trains and drives the body map. `exercises.primary/secondaryMuscles` speak heads; the
  seed bump remaps legacy spellings and `knownHeads` resolves the rest. Attribution has ONE
  definition, `headShares` — volume counts FRACTIONAL sets (primary 1.0, secondary 0.5) and an
  exercise naming no muscles falls back to `CATEGORY_HEADS`. **Fatigue is a model, not a
  measurement** (decayed `sets × effort(RIR)`): tune it in `muscle-load.ts` constants, and never
  let the UI present it as a physiological reading. `react-native-body-highlighter` draws fewer
  regions than metri measures, so it stays confined to `components/BodyMap.tsx`, which collapses
  heads onto regions; the drilldown restores the detail. Colours live in `muscle-colors.ts` (never
  inline) and always pair with `<MapLegend>`, since hue alone is not an accessible signal.
- **Knowledge base** lives in `features/docs/content/{en,es}/<category>.ts`, aggregated by
  `content/{en,es}.ts` in the Explore order; `docs.test.ts` enforces identical id sequences and
  resolvable `/docs/<id>` links. Voice: metri's own, agnostic, no coach/course/brand names; numbers
  in tables (rendered as cards); calculator links use the web slugs mapped in `openContentLink.ts`.
  A new `DocCategory` must be added to `TOPICS` (`features/explore/topics.ts`) or it never shows.
  Home pins `DEFAULT_PINNED` (`features/home/quick-actions.ts`) until the user customizes.
- **Seed ids are a contract.** Catalog exercise ids and preset template ids (`metri-foundations`,
  `metri-progression`) are referenced by user history and enrolled copies. `seedTraining` is
  versioned in `app_meta`; removing a built-in exercise goes through the demote-or-delete
  migration in `seed.ts` (never a bare delete), and retired template ids (pb-2-0, ul-4, fb-3)
  are never reused. Bilingual catalog/preset copy lives in content modules
  (`exercise-content.ts`, `programs/index.ts`), not the i18n dictionaries.
- Conventional Commits (commitlint); husky runs lint-staged pre-commit and `bun run ci` pre-push.

## CI & release (sideloaded beta — no store pushes a binary for you)

Full walkthrough in `docs/release.md`. Breakable rules:

- Never pass `--output` to a cloud `eas build`; the APK job resolves the artifact via `--json`.
- OTA publishes with `--channel beta`, never `--auto`. The build profile stays named `preview` —
  profile and channel names are independent.
- `runtimeVersion` = `fingerprint` policy + `fingerprint.config.js` (skips `ExpoConfigVersions` and
  `ExpoConfigExtraSection`). Don't revert to `appVersion`, don't delete the config — either strands
  every install from OTA.
- **Native vs JS-only dependencies**: a native module (e.g. `react-native-view-shot`,
  `expo-sharing`, `react-native-notify-kit`) changes the `runtimeVersion` fingerprint → needs a
  new APK; JS-only libs (`react-native-reorderable-list`, `sql.js`,
  `react-native-body-highlighter` — it draws on the `react-native-svg` already bundled) ship
  over OTA.
- `app.config.ts` fails safe to the production API URL (dev URL only under
  `NODE_ENV === 'development'`); `eas.json`/workflows pin `EXPO_PUBLIC_AUTH_URL` on top.
- The `apk-beta` release tag and `metri.apk` asset name are hard-coded by metri.info — never rename.
- Versions (`package.json`, `CHANGELOG.md`, `app.json → expo.version`) are release-please's; never
  bump by hand.
