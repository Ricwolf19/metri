# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

@AGENTS.md

## Project

**metri** — offline-first workout tracker (Expo SDK 56, React Native 0.85, TypeScript strict).
On top of the offline-first foundation, the app now has **local authentication**, a tabbed shell
(navbar + bottom tabs), profile management, and its first tool — a **Harris–Benedict BMR
calculator**. The training domain model (exercises, workouts, sets) is still deferred.

`src/db/schema.ts` has the `app_meta` plumbing table plus a `users` table that backs local auth and
the per-user profile (incl. body metrics + latest BMR/TDEE). Auth is intentionally **local-only**
for v1 (no server): passwords are salted + key-stretched with `expo-crypto`, the session id lives in
MMKV, and roles (`admin`/`user`) gate sections. When a cloud mirror (PostgreSQL + Better Auth) lands
later, these columns map across 1:1 and local becomes the synced offline cache — so Better Auth is
deliberately NOT pulled in yet.

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
  `finishOnboarding`, `reload`, and `hasRole`. Never surface `passwordHash`/`passwordSalt` — the repo's
  `PublicUser` already strips them. The master admin is seeded on first launch from `EXPO_PUBLIC_ADMIN_*`
  env vars (see `.env.example`); seeding is idempotent.
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
  **Native — needs a rebuild.** Cloud sync (Supabase/R2) is the later step.
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

## Android local build

React Native 0.85 pins its toolchain to **JDK 17** (newer JDKs fail). Homebrew installs `openjdk@17`
keg-only, so a global `~/.gradle/gradle.properties` must point Gradle at it with `auto-download=false` —
otherwise Gradle's bundled foojay plugin (v0.5.0) tries to auto-download a toolchain and crashes under
Gradle 9 (`NoSuchFieldError ... IBM_SEMERU`). Full setup in `README.md` → "Local Android Setup".
