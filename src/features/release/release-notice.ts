import type { UpdateKind } from './update-kind';
import { isNewerVersion } from './version';

/**
 * Whether a discovered release earns the one system notification it is
 * allowed: only an update this install can act on, and only a version newer
 * than the last one announced — so the daily check never repeats itself.
 */
export const shouldNotifyRelease = ({
  kind,
  version,
  notifiedVersion,
}: {
  kind: UpdateKind;
  version: string;
  notifiedVersion: string | null;
}): boolean =>
  kind !== 'none' &&
  notifiedVersion !== version &&
  // An unreadable stored value (older build, corruption) must not mute every future release.
  (notifiedVersion === null || !isNewerVersion(version, notifiedVersion));
