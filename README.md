<div align="center">

<img src="./assets/images/icon.png" alt="metri logo" width="120" height="120" />

# metri

**Offline-first workout tracker for serious lifters.**

[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020.svg)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61dafb.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)](https://www.typescriptlang.org/)
[![NativeWind](https://img.shields.io/badge/NativeWind-v4-38bdf8.svg)](https://www.nativewind.dev/)

</div>

---

## What is metri?

metri is a mobile workout tracker built for people who train seriously and want their data
to be **fast, private, and always available** — even with no connection at the gym.

The whole app runs **offline-first**: the database lives on your device and is the single
source of truth. There is no spinner waiting on a server to log a set.

metri needs **no account**: local mode runs the full app — every feature and update — with
your data living only in on-device SQLite. **Export and import are unconditional** — no account,
no Premium, no exceptions. A **free account** (email and password; no payment, no card, no trial)
is optional and adds account security and profile restore on reinstall. **Premium** adds automatic
cloud sync across unlimited devices. Creating the account later adopts your local profile in
place — everything you already logged survives.

> **Create the account in the app, or ahead of time at
> [metri.info/sign-up](https://metri.info/sign-up)** ([español](https://metri.info/es/registrarse)).
> It is the same account either way — the app authenticates against the web backend, so the
> credentials you register in the browser work directly on your phone.

The [web app](https://metri.info) calculators and guides are equally open to everyone with no
sign-up at all.

- **Instant logging** — the UI reads straight from on-device SQLite, no network round-trips.
- **Your data stays yours** — nothing leaves the phone until you turn on cloud sync, an
  opt-in Premium feature. Progress photos are never uploaded, and a one-tap export is always
  available (see [Your data](#your-data)).
- **Built for lifters** — 16 calculators, an evidence-based knowledge base, and a training
  tracker: programs with phases and splits scheduled by weekday and time, drag-and-drop editing,
  session logging with warm-ups and history, adherence and per-split reminders. Two ready-made
  programs (Metri Foundations and Metri Progression) and per-exercise technique guides with
  animated movement illustrations ship built in.
- **Analytics that follow the plan** — an interactive body map (volume balance, estimated fatigue,
  training recency) you can tap muscle by muscle, plus the numbers behind it: planned-vs-actual RIR,
  hard sets, monthly sessions and a body-weight trend. Fatigue is shown as the estimate it is.
- **Deliberate by design** — irreversible actions are press-and-hold, edits are saved explicitly,
  dates follow your preferred format, and any training day can be shared as a brand card.

> **Status:** **open beta on Android**, distributed as a direct APK download from
> [metri.info/download](https://metri.info/download) while the Play Store listing is
> prepared. iOS is not available yet — Apple requires TestFlight for betas.

---

## Your data

Two promises, and they are enforced in code rather than in copy:

**You can always take your data out.** The export button is available to every user, including
one who has never created an account. It produces a single JSON file — programs, routines,
sessions, every logged set, adherence history, reminders and your progress-photo timeline — in a
[documented schema](./AGENTS.md). Importing it back is equally unconditional. If metri ever
disappears, your training history does not go with it.

**Your data is private by default.** The database lives on your device and is the source of
truth. Nothing is uploaded until you explicitly enable Premium cloud sync, and even then the
server stores opaque rows it never reads. Progress photos and reminders are never synced at
all; photo exports carry the dates, weights and notes, never the image files or their paths.
Crash reporting is anonymous (account id only, no personal data) and switches off entirely
without a DSN.

**What we charge for.** Only cloud sync today, and future add-ons such as a watch app — never
access to your own data, and never a feature you already had. Anything that would make your
history harder to leave with is off the table.

---

## Tech stack

- **Expo + React Native** with Expo Router, TypeScript strict, NativeWind (Tailwind) — one codebase
  for Android and iOS, running on a development build (native modules: MMKV, notifications).
- **Offline-first data**: expo-sqlite + Drizzle ORM with live queries as the single source of truth;
  MMKV for settings and hot-path flags.
- **Accounts and sync** on the metri.info backend (Better Auth); Premium cloud sync is described in
  [`docs/sync.md`](./docs/sync.md).
- **Quality gate**: ESLint, Prettier, knip, secretlint and Vitest (pure logic plus repo tests
  against the real migrations on sql.js), all behind `bun run verify`.

---

## Quick start

**Prerequisites**

- Node.js (LTS) and [Bun](https://bun.sh) >= 1.3
- **JDK 17** (required by the React Native Android toolchain — see [`docs/android-setup.md`](./docs/android-setup.md))
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

## Documentation

| Document                                           | What it covers                                                                               |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [`AGENTS.md`](./AGENTS.md)                         | Layout, commands, architecture invariants and conventions for contributors and coding agents |
| [`docs/android-setup.md`](./docs/android-setup.md) | JDK 17 + Gradle setup on macOS, resetting local data, running wirelessly                     |
| [`docs/release.md`](./docs/release.md)             | CI workflows, secrets, release flow, OTA vs APK rules                                        |
| [`docs/sync.md`](./docs/sync.md)                   | Premium cloud sync: protocol, engine invariants, UI indicators                               |
| [`docs/brand.md`](./docs/brand.md)                 | Logo sources, launcher assets, palette                                                       |

---

## License

MIT (c) Ricardo Tapia. See [LICENSE](./LICENSE).
