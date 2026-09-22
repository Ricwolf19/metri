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
merges. `EXPORT_VERSION` 3 added export-only `progressPhotos` metadata (never the file paths); 4 adds the
body and food tables. Bumps only ever ADD keys, so `validate-import.ts` accepts 2–4. Cloud sync is
Premium-only and automatic. `README.md` is the presentation card only; the long-form docs live in
`docs/`: `android-setup.md` (JDK 17, reset, wireless), `release.md` (CI/release walkthrough),
`sync.md` (protocol, mobile half — server half in the web repo's `docs/sync.md`), `brand.md`.

## Layout

```
src/app/         Expo Router screens: (auth), (tabs), training/{program,start,edit,workout,history},
                 metrics-customize, plan, profile…
src/components/  ui/ (shared primitives — import from the barrel), icons/ (Iconoir barrel), TopBar
src/db/          schema.ts, client.ts, migrations/ (generated)
src/features/    training (repos, schedule, editors' components, analytics engine), metrics
                 (tab sections + layout), auth, sync, plan (export/import), body (check-in, goals),
                 nutrition (food diary), notifications, calculators, widget, legal, home, explore,
                 docs (content/{en,es}/*)
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
bun scripts/build-foods.ts <sr-legacy.json>   # regenerate the food catalogue, then `bun run format`
```

A knip or i18n:check finding FAILS the gate: delete/unexport dead code, remove orphaned dictionary
keys. Every production bug fix ships with the test that would have caught it.

## Architecture invariants

- **`useLiveQuery` deps are load-bearing, not an optimisation.** Drizzle captures the query on
  mount, so a missing deps array pins it to the mount-time arguments — a screen that mounts before
  auth resolves stays bound to `userId: ''` and reads back nothing. An empty result that a writer
  then acts on is data loss, not staleness (the adherence catch-up nearly overwrote a month of
  history this way).
- **Stored JSON goes through `parseJson`/`parseJsonArray` (`lib/safe-json.ts`).** MMKV values
  outlive app updates; a bare `JSON.parse` on a shape an older build wrote throws, and one throw
  inside the notification reconcile loop took every scheduled reminder with it.
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
- **A 401/403 is an answer, not a retry.** `syncFailure` raises `SyncAuthError` (`sync/errors.ts`)
  and `useAutoSync` stops the loop instead of backing off into it. An empty
  `authClient.getCookie()` means the session is already gone, so `syncNow` refuses to send at all:
  that cookie-less request raced ahead of `revalidate`'s sign-out and 401'd every foreground.

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
- **Telemetry is for surprises only.** An expected refusal is an answer, not a defect, and must
  never reach `captureError`: rejected credentials (`AuthRejectedError`, 4xx only — a 5xx still
  reports), a dismissed share sheet, a refused sync session, and anything `isNetworkFailure`
  matches. The rule is enforced at five call sites; add the guard when you add the sixth.
- **Expected outcomes never reach Sentry.** Connectivity loss is filtered centrally
  (`lib/network-errors.ts`, used by both `captureError` and `beforeSend` — SDK 57's global `fetch`
  is `expo/fetch`, so offline reads as `fetch failed: …`), and callers filter their own: a rejected
  credential (`AuthRejectedError`), a dismissed share sheet, a refused sync session.
- **Screens**: navbar via `Screen`'s `header` slot (`<TopBar>`, floating pill). Tab screens:
  `<TopBar menu showFaq showBeta />` + `<ScreenTitle>` as the first content block. Nested screens:
  `<TopBar showBack showAvatar={false} title subtitle />` and no `ScreenTitle` (training is
  migrated; other nested screens follow).
- **Editors** buffer a draft + `dirty`, persist structure (add/delete/reorder) immediately, and
  guard leaving with `useUnsavedGuard` (Save & leave / Discard / Cancel). Every irreversible action
  is a `<HoldButton>` (press-and-hold) — inline and inside dialogs (`style: 'destructive'` renders
  one). Toasts only for save/delete/start/abandon.
- **Overlays** sit behind `<Scrim>`, never a bare translucent black — one backdrop for dialogs,
  sheets, the blocking wait and full-screen viewers. **iOS frosts, Android dims, and that is
  deliberate**: iOS blurs the window, so `BlurView` works inside a `Modal` with no setup, while
  Android's blur copies a target view hierarchy into a bitmap every frame and our overlays live in
  modals — a separate native window with nothing in reach to sample. Without a `blurTarget` the
  native view silently renders NO blur (the method falls back to `'none'`), and naming one around
  the whole app drags the entire tree through a per-frame capture: it arrived late, stuttered and
  destabilised the render pass. Don't retry that. Never animate the blur layer either — changing a
  blur view's opacity recomputes the effect per frame; only the dim carries a transition.
  `<BlockingOverlay>` is a `Modal` for the same reason a sheet is: as a child of a scrolling
  `Screen` an absolute overlay anchors to the CONTENT, so it drifted off centre on a scrolled page.
- **A strip of badges scrolls, it never wraps** — `<BadgeRow>` (read-only: muscles, cues, tags) and
  `<ChipRow>` (single-select) both sit on `<ScrollRow>`, which puts a static chevron on whichever
  edge still has content. Wrapped strips grew downwards and pushed the screen's real subject below
  the fold, and a `+3` counter names what it hides without letting anyone see it. The cues do not
  animate: these rows repeat down a list. `ScrollRow` re-reads its geometry on `onScrollEndDrag`
  and `onMomentumScrollEnd` as well as `onScroll`, because a throttled `onScroll` misses the last
  frame of a fling and leaves a chevron parked over the very item just scrolled to.
- **Motion**: no springs, no bounce. Dialogs only fade (the Modal's own fade); sheets are `<Sheet>`,
  a plain RN `Modal` with a timing rise + scrim fade; the handle drags between `snapPoints` (pull
  down to close), scrim/handle tap/back close too. No third-party sheet: `@gorhom/bottom-sheet` was
  removed after its content-sized modals opened invisible on device, and Select/TagPicker/the
  session's effort picker cannot afford a surface that sometimes fails. **An overlay's resting
  state must be visible without any animation running**: shared values start at the shown
  position and effects only decorate. A Modal-hosted view whose visibility depended on an
  effect-started reanimated animation opened invisible (touches landed, nothing drew) once the
  React Compiler memoized it — verified on the emulator, so don't reintroduce that shape. Press
  feedback is a 110ms timing. Bounded lists that may overflow use `<ScrollArea>` so the edge
  chevron hints there is more — inside a sheet use `<ScrollArea inSheet>` (fills the sheet,
  safe-area padded).
- **Dates** render through `useDateFormat()` (user preset in Settings), never `toLocaleDateString`
  in a screen. Storage keys stay 'YYYY-MM-DD'.
- **Section headers** are `<SectionLabel label hint>`; the hint always stacks below the label (a
  label + hint on one `justify-between` row overflows in ES).
- **Stat rows shrink, never wrap.** Three `<Stat>` to a row leaves ~90dp per column and an
  uppercase mono label with wide tracking is the widest text the app renders — the label
  auto-shrinks (`adjustsFontSizeToFit`) and the unit is `shrink-0`, so Spanish can't knock the
  values off a shared baseline.
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
- **The rest runs as a notifee foreground service**, registered at the bundle entry beside the
  background handler. That is the only reason the alarm can ring at all: with the app merely
  backgrounded there is no React tree left to run it, and Android stops plain audio when the
  screen goes off. The service owns the countdown too, because exact alarms are denied by default
  from Android 14 on for anything that is not a clock, so the `AlarmManager` trigger can land
  minutes late in Doze — it stays armed only as a fallback for a service the OS killed, and the
  service cancels it on the way to ringing so nothing sounds twice. The service needs
  `foregroundService.types` in the notify-kit plugin config, and a plugin change means a prebuild.
- **A registered notification channel is immutable.** Changing a channel's sound or importance in
  code is silently ignored on every device that already has it, which is why the rest channel ids
  carry a `-v2` suffix and the old ids are deleted on init. Bump the suffix whenever those settings
  change. Note a channel cannot carry both a sound and a vibration: Android sets `FLAG_MUTE_HAPTIC`
  as soon as a sound is attached, so the repeating buzz is driven from `lib/sounds.ts` instead.
- **`startRest` / `extendRest` / `endRest` are the only places the alarm starts or stops.** Screens
  never call `startAlarm` or `stopAlarm` themselves; a component that did would silence an alarm the
  service legitimately owns the moment the screen unmounted.
- **Sound cues** go through `lib/sounds.ts` — the only module importing `expo-audio`. Players are
  created once and kept (decoding on first play stutters), every call is try/caught (a cue must
  never break a save) and the rest alarm loops until `stopAlarm()`. Notification sounds are a
  separate path: bundled by the expo-notifications plugin (`app.json → sounds`) and named in the
  notifee channel. **Android resolves them from `res/raw`, whose filenames allow no dashes** —
  `rest_alarm.wav`, never `rest-alarm.wav`. The looping rest-over alert needs its OWN channel:
  sound is fixed per channel on Android, so it cannot share one with the silent countdown.
  **A channel is immutable once a device has registered it** — changing its sound or importance
  in code is silently ignored there, so bump the id suffix (`rest-timer-v2`) and add the old id
  to `RETIRED_CHANNELS` or the change only reaches fresh installs.
- **Notification events** (`features/notifications/events.ts`) are a fixed catalogue the user tunes
  but never extends. Each carries a `group` (`events` | `knowledge` | `reminders`, the settings
  sections) and a `tuning` that decides its controls: `program` (read-only, follows the schedule),
  `offset` (schedule + how long after the session it lands), `frequency` (how many a day and when
  each lands), `time` (one time of day). Schedule-driven events store the RAW session times —
  `syncTrainingReminder` writes the same `schedule` to `training-time` and `session-checkin`, and
  the check-in applies its own delay at schedule time (`shiftEntries`, which rolls past midnight
  into the next weekday), so changing the delay never re-reads the program. `frequency` events
  schedule one entry per (slot, weekday) from the rotating pool in `tips.ts`, so both locale pools
  must hold at least `max(TIP_FREQUENCIES) × 7` entries or a week repeats itself (`tips.test.ts`
  enforces it). The reconciler **records each OS id as it is created** (an id it forgets can
  never be cancelled again) and runs **one at a time** — two overlapping reconciles cancel ids
  the other has not stored yet. **Removing an event means adding its id to `RETIRED_EVENT_IDS`** — the OS keeps
  firing notifications the catalogue no longer knows how to cancel. Budget matters: iOS caps a
  process at 64 pending requests, and tips alone take `timesPerDay × 7`.
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
  The Home catch-up asks about unresolved planned days up to 30 back (trained / rest / missed, plus
  a bulk "all missed"), and about TODAY only once its scheduled session plus the check-in delay has
  passed — otherwise the check-in notification would ask a question the app offers nowhere to answer.
- **Session history is append-only; deletion is the one undo.** A repeated split is a new
  `workout_logs` row, never a rewrite. `deleteWorkout` (reached from `/training/history` and the
  day sheet, both through `<DeleteSessionButton>`) hard-deletes the log + sets with tombstones, hands
  the `training_days` mark to another session finished that day or clears it, and calls
  `rewindUserProgram` — the inverse of `advanceUserProgram`. Rewind only moves BACK, and never
  past the deleted week, so a position set by hand survives; it reopens a completed program only
  when nothing else is enrolled.
- **Warm-up sets** are `set_logs.isWarmup` rows logged from the same screen. Every read path
  excludes them — volume, PRs, e1RM, progression and the muscle models — so a new aggregate must
  filter them too. They never start the prescribed rest and carry no RIR (submaximal by
  definition); `warmup.ts` only suggests the ramp, the lifter still confirms each row.
- **Warm-up routines** (`warmup_routines`, synced) are a different thing: the work AROUND the
  session, a flat ordered `steps` JSON, never a program tree. Shipped ones carry a NULL `user_id`
  and `is_custom = 0`, are re-upserted by the seed (edit the copy in `warmup-content.ts` and it
  lands on the next launch) and can only be copied, never edited or deleted; only `is_custom`
  rows sync. The shipped content follows RAMP (raise, activate, mobilise, potentiate) and static
  stretching stays after the session — don't "fix" that into a pre-lift stretch.
- **The Metrics tab owns no content.** It renders the registry in `features/metrics/sections.ts`,
  ordered by the user's saved layout (`useMetricsLayout`, MMKV, edited on `/metrics-customize`).
  Adding a section = one entry there; ids are persisted, so never rename or reuse one, and a
  section shipped after a layout was saved joins the end rather than disappearing. Energy
  expenditure lives at the top of Home, not here.
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
- **Body & goals** (`features/body/`). Weight is judged as a WEEKLY AVERAGE (`weekly.ts`; under 3
  weigh-ins a week is shown but never judged) and never alone — `interpretWeek` reads it with the
  key tape site (waist for men, hips for women). Tape sites are a code catalogue (`sites.ts`) over
  the long-format `body_measurements` table: add a site there, never a column; ids are wire
  format. A nutrition phase is a `body_goals` ROW — history, not a setting: the weight calendar is
  derived from its start date/weight/rate, weeks anchor to `startDate` (never ISO weeks), "active"
  is the newest row with `endedAt` NULL (no unique index — `startGoal` ends the previous one in the
  same transaction), and a calorie adjustment moves CARBS ONLY and appends to `adjustments` without
  resetting the start. Calories derive from the pace (`energyTarget`), floored near BMR — the floor
  raises a notice, it never silently changes the pace. Navy body fat from the tape is only ever
  OFFERED (`navy.ts`): auto-saving it would re-scale protein weekly. All rate/phase/matrix bands
  are data tables; tune them there. **One macro model**: `macroTargets` in `calculators/math`
  (g/kg, carbs = remainder) serves the calculator and the phase, mirrored 1:1 in the web repo.
- **Food diary** (`features/nutrition/`). The catalogue is a GENERATED module (`foods.data.ts`,
  built by `scripts/build-foods.ts` from USDA FoodData Central — never hand-edit a value; food
  slugs are written into `food_logs.foodId`, never rename one). Only user-made foods live in the
  DB (`custom_foods`). A `food_logs` row SNAPSHOTS its totals, so regenerating the catalogue or
  deleting a custom food never rewrites what was eaten; catalogue entries re-resolve their name
  at render so the language follows the app. The judged number is the 7-day average over LOGGED
  days (an unlogged day is unknown, not zero). No red, no "failed" states on food. It is fully
  offline — any future online food lookup must ship as an explicit, disclosed opt-in and
  amend the "local users never hit the network" rule when it does. Attribution:
  `features/nutrition/ATTRIBUTION.md`.
- **Meal ideas and day plans** (`meals.ts`, `plans.ts`) are CONTENT, not tables: read-only presets
  in code, bilingual copy beside the data (never the i18n dictionaries), ids a contract. Logging a
  meal expands it into its INGREDIENT rows so the lifter can drop or change one part. They are
  examples and the copy must keep saying so — the amounts come from the source recipes, not from
  anyone's targets. The knowledge base's food pages are GENERATED from the catalogue
  (`food-docs.ts`, one per `FoodCategory`) and their rows link to `/food/<id>`, which
  `openContentLink` routes into the app; adding a category needs an i18n key, a title/lead entry
  there, and nothing else.
- **New synced tables ship web-first.** The server rejects a whole push containing an unknown
  table, so `metri.info`'s `SYNC_TABLES` must be deployed before the mobile build that writes it.
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
- **Unnamed phases/splits are stored as `''`, never a fake default name.** Every renderer falls
  back to the localized slug (`phase-N`/`split-N`) via `routineDisplayName`/`dayDisplayName` in
  `features/training/labels.ts` (orderIndex is 0-based, slugs are 1-based). Don't re-add
  name-required validation to those editors and don't write generated names at create time.
- **`assets/exercises/` is CC BY-SA 4.0 art** (Workout Guide / Everkinetic — provenance table in
  its `ATTRIBUTION.md`). Keep that file, keep the visible credit line where frames render, and
  add new frames as id-named files plus literal `require`s in `ExerciseFrames.tsx` (Metro only
  bundles statically reachable assets). Custom exercises match visuals by name in
  `exercise-visuals.ts`; no schema field is involved.
- **Muscles are data, never tags.** Custom exercises require `primaryMuscles` (anatomical
  heads; the category derives via `HEAD_CATEGORY`), and split/session muscle chips always
  derive from the exercises (`exerciseHeads` / `dayMuscleHeads`) — the manual focus-muscles
  picker is retired and `workout_days.focus_muscles` stays as dormant wire format.
- **Per-exercise defaults** (`exercise_settings`, synced) seed `addSlot` (rest, badges,
  alternatives) and are edited on `/training/exercise/[id]`. Slot prescriptions save-block
  until every week has an effort method + sets + reps (`slot-draft.ts` owns that logic).
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
  `expo-sharing`, `react-native-notify-kit`, `expo-audio`, `expo-blur`) changes the `runtimeVersion`
  fingerprint → needs a new APK; JS-only libs (`react-native-reorderable-list`, `sql.js`,
  `react-native-body-highlighter` — it draws on the `react-native-svg` already bundled) ship
  over OTA.
- `app.config.ts` fails safe to the production API URL (dev URL only under
  `NODE_ENV === 'development'`); `eas.json`/workflows pin `EXPO_PUBLIC_AUTH_URL` on top.
- The `apk-beta` release tag and `metri.apk` asset name are hard-coded by metri.info — never rename.
- Versions (`package.json`, `CHANGELOG.md`, `app.json → expo.version`) are release-please's; never
  bump by hand.
