import type { LatestRelease } from './payload';
import { isNewerVersion } from './version';

/**
 * How a newer release reaches this install. "A newer version exists" is not
 * "you need an APK": a JS-only release ships over the OTA channel to every
 * build on the same runtime, so only a runtime change needs a new install.
 */
export type UpdateKind = 'none' | 'ota' | 'apk';

export const updateKind = ({
  installedVersion,
  installedRuntime,
  latest,
}: {
  installedVersion: string;
  /** `Updates.runtimeVersion`; null/empty on dev builds. */
  installedRuntime: string | null;
  latest: Pick<LatestRelease, 'version' | 'runtimeVersion'>;
}): UpdateKind => {
  if (!isNewerVersion(installedVersion, latest.version)) return 'none';
  // An unknown runtime on either side cannot prove OTA compatibility.
  if (installedRuntime && latest.runtimeVersion && installedRuntime === latest.runtimeVersion) {
    return 'ota';
  }
  return 'apk';
};
