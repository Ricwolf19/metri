/**
 * The runtime version (`fingerprint` policy) must track the NATIVE layer only —
 * the app is sideloaded, so an install cut off from OTA has no auto-delivery
 * path to a new APK. Neither skip is an @expo/fingerprint default:
 *
 * - `ExpoConfigVersions` — release-please bumps `expo.version` every release;
 *   without the skip each release strands existing installs.
 * - `ExpoConfigExtraSection` — `extra.apiUrl` varies with the evaluating
 *   environment; without the skip the same commit yields different runtime
 *   versions per context.
 *
 * @see README.md "CI & Release Pipeline"
 * @type {import('@expo/fingerprint').Config}
 */
module.exports = {
  sourceSkips: ['ExpoConfigVersions', 'ExpoConfigExtraSection'],
};
