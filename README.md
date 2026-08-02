<div align="center">

<img src="./assets/images/icon.png" alt="metri logo" width="120" height="120" />

# metri

**Offline-first workout tracker for serious lifters.**

[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Expo](https://img.shields.io/badge/Expo-SDK%2056-000020.svg)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.85-61dafb.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)](https://www.typescriptlang.org/)
[![NativeWind](https://img.shields.io/badge/NativeWind-v4-38bdf8.svg)](https://www.nativewind.dev/)

</div>

---

## What is metri?

metri is a mobile workout tracker built for people who train seriously and want their data
to be **fast, private, and always available** — even with no connection at the gym.

The whole app runs **offline-first**: the database lives on your device and is the single
source of truth. There is no spinner waiting on a server to log a set.

metri asks for a **free account** on first launch — email and password, or Google / GitHub.
No payment, no card, no trial: the account identifies you so your training can sync across
devices, and it stays free.

> **Create it in the app, or ahead of time at
> [metri.info/sign-up](https://metri.info/sign-up)** ([español](https://metri.info/es/registrarse)).
> It is the same account either way — the app authenticates against the web backend, so the
> credentials you register in the browser work directly on your phone.

The [web app](https://metri.info) itself is the opposite — its calculators and guides are
open to everyone with no sign-up at all.

- **Instant logging** — the UI reads straight from on-device SQLite, no network round-trips.
- **Your data stays yours** — nothing leaves the phone until you turn on cloud sync, an
  opt-in Premium feature. Progress photos are never uploaded.
- **Built for lifters** — 16 calculators, an evidence-based knowledge base, and a training
  tracker with routines, history and reminders.

> **Status:** **open beta on Android**, distributed as a direct APK download from
> [metri.info/download](https://metri.info/download) while the Play Store listing is
> prepared. iOS is not available yet — Apple requires TestFlight for betas.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Local Android Setup (the full story)](#local-android-setup-the-full-story)
- [Brand & Assets](#brand--assets)
- [Project Structure](#project-structure)
- [Architecture Notes](#architecture-notes)
- [Scripts](#scripts)
- [CI & Release Pipeline](#ci--release-pipeline)
- [Roadmap](#roadmap)
- [License](#license)

---

## Tech Stack

| Layer           | Technology                            | Purpose                                            |
| --------------- | ------------------------------------- | -------------------------------------------------- |
| Framework       | Expo SDK 56 + React Native 0.85       | Single codebase for iOS and Android                |
| Language        | TypeScript (strict)                   | Type safety across the project                     |
| Navigation      | Expo Router                           | File-based routing                                 |
| Styling         | NativeWind v4                         | Tailwind CSS for React Native                      |
| Local DB        | expo-sqlite + Drizzle ORM             | Offline-first source of truth, with live queries   |
| Fast storage    | MMKV                                  | Synchronous reads for settings and caches          |
| Vector graphics | react-native-svg                      | In-app logo and iconography from SVG sources       |
| Package manager | Bun                                   | Install and script runner                          |
| Build           | expo-dev-client                       | Development build (required by MMKV)               |
| Hygiene         | ESLint · Prettier · knip · secretlint | Linting, formatting, dead-code and secret scanning |

Deferred to a later phase: authentication (Better Auth), a cloud database for multi-device
sync (PostgreSQL on Neon, or libSQL on Turso), and the sync engine.

---

## Quick Start

**Prerequisites**

- Node.js (LTS) and [Bun](https://bun.sh) >= 1.3
- **JDK 17** (required by the React Native 0.85 Android toolchain — see below)
- Xcode (iOS) and/or Android Studio (Android SDK + an emulator or a device)

MMKV uses native code, so the app runs on a **development build**, not Expo Go.

```bash
git clone https://github.com/Ricwolf19/metri.git
cd metri
bun install
bunx expo run:ios      # or: bunx expo run:android
```

After the first native build, start the dev server with `bun start` and press `a` (Android)
or `i` (iOS). Editing TypeScript/TSX hot-reloads via Fast Refresh; installing native modules
or changing the app icon / `app.json` / `metro.config.js` requires a rebuild.

---

## Running from Scratch / Resetting Local Data

metri keeps **training data on-device** (SQLite + MMKV), so wiping the app's storage makes the next
launch re-run migrations from an empty database and re-seed the exercise catalog. The account itself
lives on the web backend, and so does anything already pushed by Premium cloud sync — neither is
cleared by a reinstall.

```bash
# Android — uninstall removes the app + its SQLite/MMKV data, then reinstall
adb uninstall com.ricwolf19.metri
bunx expo run:android            # migrations + training seed run automatically on first launch

# iOS simulator
xcrun simctl uninstall booted com.ricwolf19.metri
bunx expo run:ios
```

You can also clear data without uninstalling: Android → Settings → Apps → Metri → Storage → **Clear
storage**; iOS → long-press the app → **Remove App**.

**Full native rebuild** — needed after changing the app icon, **splash screen**, `app.json`, or adding
a native module (an OTA update is not enough):

```bash
bunx expo prebuild --clean
bunx expo run:android            # or: bunx expo run:ios
```

**Regenerate SQL migrations** after editing `src/db/schema.ts` (the new file applies on next launch):

```bash
bun run db:generate
```

> No env vars are needed to build or run. Accounts live on the metri.info backend (Better Auth) —
> there is no local admin seed. The only optional variable is `EXPO_PUBLIC_AUTH_URL` to point a dev
> build at a different backend origin (documented in `app.config.ts`). Crash reporting (Sentry) is
> configured in `src/lib/telemetry.ts` — the DSN is a public client key hardcoded there (empty =
> disabled); `SENTRY_AUTH_TOKEN` exists only as a CI/EAS secret for source-map uploads.

---

## Local Android Setup (the full story)

The Android build needs a specific JVM. Getting this wrong produces a confusing Gradle crash,
so here is the exact, working setup on macOS (Apple Silicon).

### 1. Install JDK 17

React Native 0.85 pins its Gradle/Kotlin toolchain to **Java 17**. Newer JDKs (21, 24) can
_run_ Gradle but are not accepted for the compile toolchain.

```bash
brew install openjdk@17
```

Point `JAVA_HOME` at it (in `~/.zshrc`), and open a **new terminal** afterwards:

```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
```

Verify: `java -version` should report `17.x`.

### 2. Tell Gradle where the JDK is

Homebrew installs `openjdk@17` _keg-only_, so Gradle's auto-detection can't find it. Add a
**global** `~/.gradle/gradle.properties` (lives outside the repo, survives `expo prebuild`):

```properties
org.gradle.java.installations.paths=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
org.gradle.java.installations.auto-download=false
```

### 3. Android SDK

Ensure `ANDROID_HOME` points at your SDK (in `~/.zshrc`):

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"
```

### Troubleshooting: `JvmVendorSpec ... IBM_SEMERU`

```
Could not initialize class org.gradle.toolchains.foojay.DistributionsKt
> NoSuchFieldError: ... JvmVendorSpec ... IBM_SEMERU
```

This means no local JDK 17 was found, so Gradle tried to **auto-download** a toolchain via
the bundled `foojay` plugin (v0.5.0), which is incompatible with Gradle 9. Fixing steps 1–2
above (install JDK 17 + `auto-download=false`) resolves it. If a stale daemon lingers, run
`cd android && ./gradlew --stop` and rebuild.

### Running wirelessly

Wireless debugging works on Android: pair the device over Wi-Fi with
`adb pair <ip:port>` / `adb connect <ip:port>` (Developer Options → Wireless debugging), then
`bunx expo run:android` installs to it like a USB device and Metro reloads over the network.

---

## Brand & Assets

The brand mark is a lime **dumbbell** rendered as bars, paired with the `metri` wordmark, on a
near-black background. SVG sources live in `assets/images/`; the launcher PNGs in
`assets/images/` are generated from them (e.g. with `rsvg-convert -w 1024 -h 1024 …`).

| File                                | What it is                               | Used for                             |
| ----------------------------------- | ---------------------------------------- | ------------------------------------ |
| `assets/images/metri.svg`           | Full logo (mark + wordmark) on dark bg   | Master / reference                   |
| `assets/images/metri-logo.svg`      | Mark + wordmark, transparent, tight crop | In-app cover (`src/app/index.tsx`)   |
| `assets/images/metri-icon.svg`      | Dumbbell mark only, black background     | App launcher icon                    |
| `assets/images/metri-icon-mono.svg` | Dumbbell mark, white on transparent      | Android 13+ themed (monochrome) icon |

Palette: lime accent `#bef82b` on a cool, blue-tinted dark "ink" scale (app background
`#0b0d12`). See `tailwind.config.js`.

In-app, SVGs are imported as components via `react-native-svg-transformer` (configured in
`metro.config.js`), e.g. `import MetriLogo from '@/assets/images/metri-logo.svg'`.

---

## Project Structure

```
metri/
├── src/
│   ├── app/                 # Expo Router screens
│   │   ├── _layout.tsx      # Root layout: theme, runs DB migrations on launch
│   │   └── index.tsx        # Home screen (renders the SVG brand logo)
│   ├── db/
│   │   ├── schema.ts        # Drizzle schema (SQLite) — plumbing only for now
│   │   ├── client.ts        # SQLite connection + Drizzle instance
│   │   └── migrations/      # Generated SQL migrations (do not edit by hand)
│   ├── lib/
│   │   └── storage.ts       # MMKV instance and typed settings helpers
│   ├── types/
│   │   └── svg.d.ts         # Ambient types for *.svg component imports
│   └── global.css           # Tailwind directives + font variables
├── assets/
│   └── images/              # SVG brand sources + generated launcher icons, splash, favicon
├── tailwind.config.js       # Brand palette (lime accent on cool dark "ink")
├── drizzle.config.ts        # Drizzle Kit config (SQLite, expo driver)
├── metro.config.js          # NativeWind + SVG transformer + .sql resolver
├── babel.config.js          # NativeWind preset + Drizzle inline SQL import
├── knip.json                # Dead-code / unused-dependency config
└── app.json                 # Expo app config (icons, plugins, updates)
```

---

## Architecture Notes

The app is offline-first. SQLite on the device is the source of truth; the UI reacts to it
through Drizzle's `useLiveQuery`, so no global state library is needed. MMKV holds small,
synchronously-read values (units, theme, caches) and does not replace the relational store.

| Decision                                        | Rationale                                                       |
| ----------------------------------------------- | --------------------------------------------------------------- |
| Drizzle over a heavier ORM                      | Thin query builder, generates plain SQL, raw `sql` escape hatch |
| SQLite live queries over Zustand/TanStack Query | The database drives the UI; fewer moving parts                  |
| MMKV alongside SQLite                           | Synchronous reads for the hot path; SQLite for relational data  |
| Bun                                             | Fast installs and scripts; supported by Expo and EAS            |

Database migrations are generated with Drizzle Kit and applied automatically on launch by
`useMigrations` in the root layout.

---

## Scripts

```bash
bun start              # Start the Metro dev server
bun run android        # Build + run on Android
bun run ios            # Build + run on iOS
bun run verify         # format:check + lint + typecheck + test + i18n:check + deadcode
bun run test           # vitest — unit tests (pure logic: calculators math, more to come)
bun run ci             # verify + secrets:scan + doctor — mirrors the GitHub CI quality job (pre-push hook)
bun run typecheck      # tsc --noEmit
bun run lint           # ESLint (expo lint)
bun run format         # Prettier write
bun run deadcode       # knip — unused files, exports and dependencies (fails the gate)
bun run i18n:check     # fail on i18n dictionary keys that no source file references
bun run secrets:scan   # secretlint over the repo
bun run db:generate    # Generate SQL migrations from the Drizzle schema
bun run db:studio      # Open Drizzle Studio
bun run doctor         # expo-doctor health check
```

---

## CI & Release Pipeline

Four workflows in `.github/workflows/`. Every Expo step is guarded on `EXPO_TOKEN` and skips
cleanly when the secret is absent, so forks and fresh clones do not fail red.

| Workflow             | Trigger                                            | What it does                                                                |
| -------------------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| `ci.yml`             | PR to `main`                                       | `format:check`, `lint`, `typecheck`, `secrets:scan`, `expo-doctor`          |
| `eas-update.yml`     | push to `main`                                     | Publishes an OTA JS update to the `beta` channel                            |
| `release-please.yml` | push to `main`                                     | Maintains the release PR; on merge, tags the release and calls the APK job  |
| `apk-beta.yml`       | `workflow_call` from release-please, or manual run | Cloud-builds the APK and publishes it to the `apk-beta` rolling pre-release |

All four share `.github/actions/setup-repo` (Node 22 + Bun + cached `bun install --frozen-lockfile`).

### Secrets

- **`EXPO_TOKEN`** — Expo access token. Required by `eas-update.yml` and `apk-beta.yml`.
- **`GITHUB_TOKEN`** — provided by Actions. `apk-beta.yml` scopes it to `contents: write` at the job
  level so it can upload the release asset; the repo default is read-only.

### Release flow

1. Conventional Commits land on `main`. Each push publishes an OTA update, so JS-only changes reach
   installed builds without a new APK.
2. release-please keeps a release PR open with the changelog and the version bumps. It rewrites
   `package.json`, `CHANGELOG.md` and `app.json` → `$.expo.version` (configured as an `extra-files`
   jsonpath in `release-please-config.json`).
3. Merging that PR creates the tag and the GitHub release, which sets `release_created=true` and
   invokes `apk-beta.yml`.
4. The APK is built on EAS with the `preview` profile and uploaded to the `apk-beta` pre-release,
   alongside a `metri.apk.sha256` checksum for manual verification.

Testers see the whole story in the app itself: a dismissable banner on Home routes to `/beta`
(`src/app/beta.tsx`), which shows the running version, explains automatic vs. manual updates, and
walks through installing a new APK. Dismissal is stored per version, so the banner returns on the
next release.

### Load-bearing details

- **`eas build --output` only works for local builds.** On a cloud build the CLI aborts with
  `--output is allowed only for local builds`. `apk-beta.yml` therefore runs the build with `--json`
  and downloads `artifacts.applicationArchiveUrl` with `curl`. Do not "simplify" it back to
  `--output`.
- **OTA updates target the channel, not the branch.** `eas update --auto` publishes to an EAS branch
  named after the git branch (`main`), but EAS links a channel to a branch of the _same name_ — so
  the `beta` channel baked into the APK would never see those updates. Publishing with
  `--channel beta` lets EAS resolve the branch on its side. Verify the mapping with
  `eas channel:view beta`.
- **The channel is baked into the APK at build time.** `eas.json` → `preview` → `channel: beta` is
  what installed builds listen on. The profile keeps EAS's scaffolding name; the channel is named for
  what it actually is, a public beta. Renaming the channel orphans every existing install until its
  owner manually re-downloads, so treat it as immutable once testers are out there.
- **`runtimeVersion` follows the `fingerprint` policy**, with `fingerprint.config.js` skipping
  `ExpoConfigVersions` and `ExpoConfigExtraSection`. That combination is deliberate: the app is
  sideloaded, so nothing pushes a new APK to anyone. Under the old `appVersion` policy every release
  froze existing installs out of OTA silently. With the fingerprint, the runtime version tracks the
  _native_ layer only — JS-only releases keep reaching every install, and a native change correctly
  cuts them off until they grab the new APK. Neither skip is in @expo/fingerprint's defaults:
  without `ExpoConfigVersions` the release bump alone would change the hash, and without
  `ExpoConfigExtraSection` the env-dependent `extra.apiUrl` made the _same commit_ produce different
  runtime versions in different contexts.
- **The API URL defaults to production.** `app.config.ts` only picks the dev URL (`10.0.2.2`, the
  emulator's host loopback) when `NODE_ENV` is explicitly `development` — which the Expo dev server
  sets. The config is also evaluated in contexts with no `NODE_ENV` at all (the EAS builder's
  manifest step, `eas update` in CI), and the first beta APK shipped pointing at the emulator's
  localhost because the old code treated "not production" as "development". Belt and braces, the
  `preview`/`production` build profiles and the OTA workflow also pin `EXPO_PUBLIC_AUTH_URL`.
- **The `apk-beta` tag and the `metri.apk` asset name are a public contract.** metri.info hard-codes
  `releases/download/apk-beta/metri.apk`. Renaming either breaks the download page.
- **The release body is written by hand** (EN + ES install instructions) and must survive rebuilds,
  so the workflow only replaces the assets (`gh release upload --clobber`) and never edits the notes.
- **release-please cannot trigger a workflow via `release: published`.** The release is created with
  `GITHUB_TOKEN`, and GitHub does not fire workflows from token-generated events — hence the explicit
  `workflow_call`.
- **Every APK must be signed by the same key.** EAS generates the Android keystore on the first
  non-interactive cloud build and reuses it after that. An APK signed with a different key cannot be
  installed over an existing one — testers would have to uninstall first, which erases the local
  SQLite/MMKV data. Back the keystore up (`eas credentials -p android`).

### Rebuilding the APK without cutting a release

`apk-beta.yml` also exposes a manual button — **Actions → Beta APK → Run workflow** — for refreshing
the beta download after a fix that does not warrant a version bump.

---

## Roadmap

1. Define the domain model (exercises, workouts, sets, body metrics) and migrations.
2. Build the core logging flow and history.
3. Add progress metrics (estimated 1RM, weekly volume, PRs).
4. Add authentication and cloud sync (Better Auth + remote database).

---

## License

MIT (c) Ricardo Tapia. See [LICENSE](./LICENSE).
