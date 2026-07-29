/**
 * Fingerprint inputs for the `runtimeVersion: { policy: "fingerprint" }` in app.json.
 *
 * `ExpoConfigVersions` is NOT part of @expo/fingerprint's default source skips, so without this
 * file release-please's `expo.version` bump would change the runtime version on every release —
 * exactly the `appVersion` policy behaviour we moved away from. The app ships as a sideloaded APK
 * with no store auto-update, so a runtime version that changes per release strands every install
 * that does not manually re-download.
 *
 * Skipping it means the runtime version tracks the NATIVE layer only: JS-only releases keep
 * reaching every install over the air, and a native change correctly cuts old installs off until
 * they grab the new APK.
 *
 * @type {import('@expo/fingerprint').Config}
 */
module.exports = {
  sourceSkips: ['ExpoConfigVersions'],
};
