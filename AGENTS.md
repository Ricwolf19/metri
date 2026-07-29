# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

@AGENTS.md

## Project

**metri** — offline-first workout tracker (Expo SDK 56, React Native 0.85, TypeScript strict).
On top of the offline-first foundation the app has **authentication**, a tabbed shell (navbar +
bottom tabs), profile management, 16 calculators, an MDX knowledge base and a full training domain
(exercises, workouts, sets, routines, history, reminders).

**An account is required.** `src/app/index.tsx` is the entry gate: no session → `/(auth)/sign-in`.
Sign-up is free — no payment, card or trial — and auth runs through **Better Auth** against the web
backend (`@better-auth/expo`, `metri://` scheme, session in SecureStore). This is a change from v1's
local-only auth; `src/db/schema.ts` still keeps the local `users` table as the offline cache.

Contrast with the web (`metri.info`), which is **open**: its calculators and guides need no account
at all. Only the mobile app gates on sign-in. Keep this distinction accurate in every user-facing
string and in the in-app legal copy (`src/features/legal/content.ts`) — it is a privacy claim, not
marketing.

**Cloud sync** is a Premium feature (`src/features/sync/`, gated via
`src/features/auth/entitlements.ts` — check `can(plan, feature)`, never `plan === 'premium'`).
Without Premium it **never runs**; with Premium it is **automatic** — no button, no toggle.
Progress photos and reminders are never uploaded. This wording is a privacy claim that must stay in
sync with `src/features/legal/content.ts`; see the Architecture section for the mechanics.

## Commands

Package manager is **Bun**. Native code (MMKV) means the app runs on a **development build**, not Expo Go.

```bash
bun start              # Metro dev server (press a / i to open on a running build)
bun run android        # expo run:android — native build + run (needs JDK 17, see below)
bun run ios            # expo run:ios — native build + run
bun run verify         # format:check + lint + typecheck — the pre-commit gate; run before committing
bun run typecheck      # tsc --noEmit
bun run lint           # expo lint (ESLint)
bun run deadcode       # knip — unused files / exports / deps
bun run db:generate    # regenerate SQL migrations after editing src/db/schema.ts
bun run db:studio      # Drizzle Studio
```

There is no test runner configured yet.

## Architecture

**The database drives the UI — there is no global state library.** SQLite on the device is the
single source of truth; screens react to it through Drizzle's `useLiveQuery`. This works because
`src/db/client.ts` opens the DB with `enableChangeListener: true` (required for live queries to
fire on writes). Don't reach for Zustand/Redux/TanStack Query — query the DB directly.

**Two storage layers, distinct roles:**

- `src/db/` — SQLite + Drizzle ORM, the relational source of truth.
- `src/lib/storage.ts` — MMKV, synchronous key-value for small hot-path values (units, onboarding
  flags, caches) that must read instantly with no launch flash. It does **not** replace SQLite.

**Migrations apply automatically on launch.** `src/app/_layout.tsx` calls `useMigrations(db, migrations)`
and gates the whole app on it (spinner while pending, error screen on failure). Workflow for schema
changes: edit `src/db/schema.ts` → `bun run db:generate` → the new SQL lands in `src/db/migrations/`
(generated; never hand-edit) and is applied next launch.

**Routing** is file-based via Expo Router under `src/app/`. Typed routes are enabled (`app.json`
`experiments.typedRoutes`), as is the React Compiler (`experiments.reactCompiler`). Layout:
`index.tsx` is the auth gate (redirects on the local session); `(auth)/` holds sign-in/sign-up;
`(tabs)/` is the signed-in shell (Home, Tools, Reminders + an admin-only Admin tab; **Profile is
`href: null`** — reached via the avatar in `TopBar`, not the tab bar). `onboarding.tsx` (root Stack)
runs on first launch — `(tabs)/_layout` redirects there until `user.onboardedAt` is set. Pushed
screens like `calculators/*.tsx` and `reminder-edit.tsx` also live at the root Stack. **Typed routes are generated from `.expo/types/`,
which is gitignored — after adding/renaming a route, run `bun start` once (or `bun run typecheck`
will report unknown-route errors against a stale cache).**

**Feature & UI layout** (organize by ownership — split a file only when a component is reused or
large; keep tiny single-use presentational helpers co-located with their one screen):

- `src/features/<domain>/` — feature logic + its own `components/`. `features/auth/` has `users.repo.ts`,
  `auth-context.tsx`, `seed.ts`, and `components/` (`RoleGate`, `RoleBadge`); `features/bmr/` has
  `calc.ts` (pure, synchronous BMR/TDEE math, safe on every keystroke) and `components/ActivityPicker`.
- `src/components/ui/` — reusable primitives (`Button`, `Input`, `Card`, `Screen`, `SegmentedControl`,
  `Avatar`, `Toast`), one per file, imported from the `@/components/ui` barrel. `TopBar` is the navbar.
- `src/components/icons/index.ts` — **Lucide** icons (`lucide-react-native`) re-exported under app names
  (`HomeIcon`, `BellIcon`, `GearIcon`, …) so screens import a stable `<XIcon>` with `color`/`size`/
  `strokeWidth`. Icon holders are typed `ComponentType<IconProps>` (Lucide icons are `forwardRef`, not
  plain function components). Add one by mapping another Lucide icon in `index.ts`.
- **Auth/session:** `useAuth()` (from `features/auth/auth-context`) exposes the current `PublicUser`,
  `signIn/signUp/signOut`, `updateMyProfile`, `updateMyAccount` (email/username), `changeMyPassword`,
  `finishOnboarding`, `reload`, and `hasRole`. The `users` row holds **no credential material** —
  passwords live only with Better Auth on the server (migrations 0014/0015 purged and dropped the old
  local `password_hash`/`password_salt`). Never reintroduce hashing on the device.
  `useAuth` also revalidates the local session against the server on mount and on foreground; only an
  explicit "no session" signs the user out, so an offline device stays usable.
- **i18n:** EN/ES via `src/i18n/` — a typed, dependency-free dictionary (`en.ts` is the key source of
  truth; `es.ts` must cover every key). Use `const t = useT()` then `t('section.key', { name })`; the
  active locale lives in MMKV (`settings.getLocale()` → null until chosen, then defaults to the device
  language via `expo-localization`); set in onboarding/profile or the `<LocaleToggle>` (auth corner). Add a key to
  BOTH `en.ts` and `es.ts` — a missing ES key falls back to EN. Activity labels are translated via
  `activity.<key>`/`activityHint.<key>`; `bmr/calc.ts` holds only multipliers, not labels.
- **Theme (light/dark/system):** `src/theme/` — `useTheme()` exposes `scheme`/`preference`/`setPreference`
  - the nav theme + status-bar style. Colors come from CSS variables: `tailwind.config.js` maps `ink.*`
    and `accent` to `rgb(var(--x) / <alpha-value>)`, and `ThemeProvider` swaps the values per scheme via
    NativeWind's `vars()` (defaults in `global.css`). So existing `bg-ink-900`/`text-ink-50` classes adapt
    automatically — **don't hard-code hex in components**. Two rules: `ink-950` stays constant (it's the
    dark text on the lime accent), and accent **text** uses `text-accent` (legible on both), while accent
    **fills** stay `bg-lime-400`. Preference persists in MMKV; default is `dark`. For **icon `color=`**
    props (a hex, not a class), use `useTheme().accent` (lime-400 dark / lime-700 light) so green icons
    stay legible on light surfaces — don't hard-code `#bef82b`. The wordmark only reads on dark, so render
    it via `<BrandLogo>` (always-dark `ink-950` badge). The tab bar reserves `useSafeAreaInsets().bottom`.
- **Reminders / notifications:** `src/features/reminders/` — `scheduler.ts` wraps `expo-notifications`
  (handler + Android channel in `initNotifications()`, called from `_layout`; lazy permission;
  DAILY/WEEKLY scheduling) and `reminders.repo.ts` does CRUD that keeps each `reminders` row's OS
  notification in sync (best-effort + try/caught, so it no-ops gracefully before the native rebuild).
  The list uses Drizzle `useLiveQuery`. **expo-notifications is native — reminders only fire after a
  rebuild.** Reuse this generic table for any gym reminder; don't add per-topic notification code.
- **Docs:** `src/features/docs/` — bilingual knowledge base as `content/en.ts` + `content/es.ts`
  (`DocSection[]` markdown bodies, same ids). `searchDocs` ranks title > tags > body. The `docs` tab
  (`(tabs)/docs.tsx`) lists/searches; `docs/[id].tsx` renders the body via `react-native-markdown-display`
  (pure JS, no rebuild) with `markdownStyles(scheme)`. **Add a section to BOTH locale files**; it shows up
  automatically.
- **Progress photos:** `src/features/photos/` — image **files on disk** (`expo-file-system` NEW
  `File`/`Directory`/`Paths` API → `documentDir/progress/`), only metadata in the `progress_photos`
  table (uri/thumbUri/takenAt/weightKg/note — **never blobs**). `media.ts` persists full + a 600px
  thumb; `capture.ts` wraps `expo-image-picker`; `photos.repo.ts` is the live query + add/delete.
  Reached via `/progress` (Home card + Profile row, **not a tab**) → `progress/[id].tsx` viewer
  (date editable via the wheel `DatePicker`). The gallery groups by day/week/month (`period.ts`) and
  `progress/compare.tsx` does before/after side-by-side.
  **Native — needs a rebuild.** Photos are deliberately **not** synced (their URIs are local paths).
- **Cloud sync** (`src/features/sync/`) — Premium only, and **automatic**: there is no button and no
  opt-in toggle. `useAutoSync` (mounted once in `(tabs)/_layout.tsx`) fires on mount, on foreground,
  and on regaining connectivity. Without the `sync` entitlement it never runs.
  - `engine.ts` — `syncNow()` does push-then-pull. Push gathers rows whose change timestamp beats a
    per-user **watermark** (`state.ts`, MMKV) plus a **tombstone queue** (`sync_deletions`); pull
    reads by a server-time **cursor** and drains pages until `hasMore` clears.
  - Three invariants that are easy to break, all of which were real bugs:
    **(1)** every `applyRow` is individually try/caught — a throw used to skip `setCursor` and
    permanently dead-lock sync, silently. **(2)** incoming keys are intersected against
    `PRAGMA table_info`, so a row from a newer app version doesn't throw `no such column` (and a
    crafted key isn't a SQL-injection primitive). **(3)** a table with a secondary unique index
    (`training_days` on `user_id,date`) needs an `EXTRA_UNIQUE` entry — `on conflict(id)` alone
    throws when two devices create the same logical row with different ids.
  - Adding a synced table means editing `tables.ts` **and** `SYNC_TABLES` in the web repo's
    `lib/sync/contract.ts`. Synced column names are a wire format: **add, never rename.**
  - Status is published to `status.ts` and rendered by `SyncRing` around the avatar in `TopBar` —
    that ring is the only user-facing signal; failures never toast.
  - Full protocol, server-side rules and limits: **`docs/sync.md` in the metri.info repo.**
- **Animations** use the built-in **RN `Animated`** API (no reanimated/worklets babel plugin is wired —
  don't reach for reanimated worklets). Reusables: `AppLoader` (branded loading screen), `FadeInUp`
  (mount entrance, stagger via `delay`), `PressableScale` (springy tap) + the `usePressScale` hook;
  `Button` already presses-to-scale.

## Conventions & gotchas

- **Arrow functions everywhere:** components, hooks, helpers, inner functions — all arrow expressions
  (`const Foo = () => {}`; default-export screens as `const Screen = () => {}; export default Screen;`).
  No `function` declarations. Enforced by `func-style` + `react/function-component-definition` in
  `eslint.config.js`. The only exception is a named function expression inside `forwardRef(function …)`.
- **Imports:** use the `@/` alias for `src/*` and `@/assets/*` for `assets/*` (see `tsconfig.json`).
- **SVGs are components:** `import Logo from '@/assets/images/foo.svg'` works via `react-native-svg-transformer`
  (wired in `metro.config.js`). `.sql` files are also resolvable/inlinable — both `metro.config.js` and
  `babel.config.js` have special config for Drizzle migration `.sql` imports; don't remove it.
- **Styling:** NativeWind v4 (`className=`). Use the brand palette tokens from `tailwind.config.js`
  (`lime-400` = `#bef82b` accent, `ink-*` themeable scale, `accent` for accent text) rather than raw
  hex — the `ink-*`/`accent` tokens adapt to light/dark (see the Theme note above).
- **Commits:** Conventional Commits enforced by commitlint. Husky runs `lint-staged` (prettier + eslint
  - secretlint) pre-commit and `bun run verify` pre-push. Releases are automated via release-please.

## CI & release

`ci.yml` (PR gate) · `eas-update.yml` (OTA on push to main) · `release-please.yml` (version + tag,
then calls) · `apk-beta.yml` (EAS APK → `apk-beta` pre-release). The app ships **sideloaded**, so
nothing pushes a new binary to anyone — every rule below follows from that. Full walkthrough in
`README.md` → "CI & Release Pipeline". Five things that are easy to break:

- **Never pass `--output` to a cloud `eas build`** — EAS rejects it (`allowed only for local builds`).
  `apk-beta.yml` builds with `--json` and `curl`s `artifacts.applicationArchiveUrl` instead.
- **Publish OTA with `--channel beta`, not `--auto`.** `--auto` targets an EAS branch named after the
  git branch (`main`); the APK listens on the `beta` channel, which EAS links to a `beta` branch.
  `--auto` silently orphans every update. The build profile is still called `preview` (EAS's
  scaffolding name) — profile and channel names are independent, don't "align" them.
- **`runtimeVersion` is `fingerprint` + `fingerprint.config.js` skipping `ExpoConfigVersions`.**
  Don't switch back to `appVersion` and don't delete that config: either one makes every release bump
  a new runtime version, which cuts existing installs off from OTA with no way to auto-deliver the
  APK. Under fingerprint the runtime version tracks the native layer only.
- **The `apk-beta` tag and the `metri.apk` asset name are hard-coded by metri.info.** Renaming either
  breaks the public download link. The release notes are hand-written — only the assets are replaced.
- **Version lives in three files**, all bumped by release-please: `package.json`, `CHANGELOG.md`, and
  `app.json` → `$.expo.version`. Never bump them by hand.

- **Beta support surface** (`src/features/beta/` + `src/app/beta.tsx`): the running version, the
  automatic-vs-manual update story, and the manual-install steps. The Home banner stores its
  dismissal **per version** so it returns on the next release. `betaLinks` mirrors metri.info's
  `lib/site.ts` — keep the APK URL in sync with it.

## Android local build

React Native 0.85 pins its toolchain to **JDK 17** (newer JDKs fail). Homebrew installs `openjdk@17`
keg-only, so a global `~/.gradle/gradle.properties` must point Gradle at it with `auto-download=false` —
otherwise Gradle's bundled foojay plugin (v0.5.0) tries to auto-download a toolchain and crashes under
Gradle 9 (`NoSuchFieldError ... IBM_SEMERU`). Full setup in `README.md` → "Local Android Setup".
