# CI & release pipeline

Four workflows in `.github/workflows/`. Every Expo step is guarded on `EXPO_TOKEN` and skips
cleanly when the secret is absent, so forks and fresh clones do not fail red.

| Workflow             | Trigger                                            | What it does                                                                |
| -------------------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| `ci.yml`             | PR to `main`                                       | `format:check`, `lint`, `typecheck`, `secrets:scan`, `expo-doctor`          |
| `eas-update.yml`     | push to `main`                                     | Publishes an OTA JS update to the `beta` channel                            |
| `release-please.yml` | push to `main`                                     | Maintains the release PR; on merge, tags the release and calls the APK job  |
| `apk-beta.yml`       | `workflow_call` from release-please, or manual run | Cloud-builds the APK and publishes it to the `apk-beta` rolling pre-release |

All four share `.github/actions/setup-repo` (Node 22 + Bun + cached `bun install --frozen-lockfile`).

## Secrets

- **`EXPO_TOKEN`** — Expo access token. Required by `eas-update.yml` and `apk-beta.yml`.
- **`GITHUB_TOKEN`** — provided by Actions. `apk-beta.yml` scopes it to `contents: write` at the job
  level so it can upload the release asset; the repo default is read-only.

## Release flow

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

## Load-bearing details

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

## Rebuilding the APK without cutting a release

`apk-beta.yml` also exposes a manual button — **Actions → Beta APK → Run workflow** — for refreshing
the beta download after a fix that does not warrant a version bump.
