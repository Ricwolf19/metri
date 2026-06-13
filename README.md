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
source of truth. There is no spinner waiting on a server to log a set. A cloud layer for
multi-device sync is planned, but the app is fully usable without ever signing in.

- **Instant logging** — the UI reads straight from on-device SQLite, no network round-trips.
- **Your data stays yours** — nothing leaves the phone until you opt into sync.
- **Built for lifters** — the roadmap targets estimated 1RM, weekly volume, and PR tracking.

> **Status:** this repository currently contains the **project setup and foundation** only.
> The data model, screens, and features are intentionally deferred to later iterations. What
> exists today is a working base: the app builds, runs on a development build, and has the
> offline-first data layer wired end to end.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Local Android Setup (the full story)](#local-android-setup-the-full-story)
- [Brand & Assets](#brand--assets)
- [Project Structure](#project-structure)
- [Architecture Notes](#architecture-notes)
- [Scripts](#scripts)
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

metri keeps **everything on-device** (SQLite + MMKV) — there is no server to reset. Wiping the app's
storage makes the next launch re-run migrations from an empty database and re-seed the master admin.

```bash
# Android — uninstall removes the app + its SQLite/MMKV data, then reinstall
adb uninstall com.ricwolf19.metri
bunx expo run:android            # migrations + admin seed run automatically on first launch

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

> The master admin is seeded from `EXPO_PUBLIC_ADMIN_*` (see `.env.example`); set those **before**
> building, since `EXPO_PUBLIC_*` values are baked into the bundle at build time.

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
bun run verify         # format:check + lint + typecheck (pre-commit gate)
bun run typecheck      # tsc --noEmit
bun run lint           # ESLint (expo lint)
bun run format         # Prettier write
bun run deadcode       # knip — report unused files, exports and dependencies
bun run secrets:scan   # secretlint over the repo
bun run db:generate    # Generate SQL migrations from the Drizzle schema
bun run db:studio      # Open Drizzle Studio
bun run doctor         # expo-doctor health check
```

---

## Roadmap

1. Define the domain model (exercises, workouts, sets, body metrics) and migrations.
2. Build the core logging flow and history.
3. Add progress metrics (estimated 1RM, weekly volume, PRs).
4. Add authentication and cloud sync (Better Auth + remote database).

---

## License

MIT (c) Ricardo Tapia. See [LICENSE](./LICENSE).
