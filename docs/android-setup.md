# Local Android setup

Everything the Android toolchain needs on macOS (JDK 17, Gradle, SDK), plus how to reset a
device to a clean install. Quick start and the app overview live in the root `README.md`;
agent/dev conventions in `AGENTS.md`.

## Resetting local data

metri keeps **training data on-device** (SQLite + MMKV), so wiping the app's storage makes the next
launch re-run migrations from an empty database and re-seed the exercise catalog. A server account
(if you created one) lives on the web backend, and so does anything already pushed by Premium cloud
sync — neither is cleared by a reinstall. Local-mode data has no server copy: a wipe is final unless
you exported it first.

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

> No env vars are needed to build or run. Optional accounts live on the metri.info backend (Better Auth) —
> there is no local admin seed. The only optional variable is `EXPO_PUBLIC_AUTH_URL` to point a dev
> build at a different backend origin (documented in `app.config.ts`). Crash reporting (Sentry) is
> configured in `src/lib/telemetry.ts` — the DSN is a public client key hardcoded there (empty =
> disabled); `SENTRY_AUTH_TOKEN` exists only as a CI/EAS secret for source-map uploads.

## The full story

The Android build needs a specific JVM. Getting this wrong produces a confusing Gradle crash,
so here is the exact, working setup on macOS (Apple Silicon).

### 1. Install JDK 17

React Native pins its Gradle/Kotlin toolchain to **Java 17**. Newer JDKs (21, 24) can
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
