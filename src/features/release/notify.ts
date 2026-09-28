import { hasNotificationPermission, notifyNow } from '@/features/notifications/service';
import { resolveLocale } from '@/i18n';
import { en } from '@/i18n/en';
import { es } from '@/i18n/es';
import { settings } from '@/lib/storage';

import { currentUpdateKind, stageOtaUpdate } from './ota';
import type { LatestRelease } from './payload';
import { shouldNotifyRelease } from './release-notice';

// Where a tap lands: Profile carries the update card and its changelog.
const UPDATE_URL = 'metri://profile';

// resolveLocale, not settings.getLocale(): copy must match the UI's fallback language.
const strings = () => (resolveLocale() === 'es' ? es : en);

/**
 * One immediate system notification per newer version. A one-shot, not a
 * catalogue event: nothing to reconcile or cancel. Respects the master switch
 * and never prompts — a permission the user has not granted stays ungranted.
 */
export const notifyReleaseOnce = async (release: LatestRelease): Promise<void> => {
  const kind = currentUpdateKind(release);
  const notify = shouldNotifyRelease({
    kind,
    version: release.version,
    notifiedVersion: settings.getReleaseNotified(),
  });
  if (!notify || !settings.getNotificationsEnabled()) return;
  if (!(await hasNotificationPermission())) return;
  // The tap lands on Profile, whose card only shows a STAGED OTA: announcing one
  // the channel has not delivered would open a screen with nothing to act on.
  // Left unrecorded, so the next daily check announces it once it is staged.
  if (kind === 'ota' && !(await stageOtaUpdate())) return;
  // Recorded before scheduling: a second check racing this one must not double up.
  settings.setReleaseNotified(release.version);
  const s = strings();
  await notifyNow('reminders', {
    title: s['release.notifTitle'].replace('{version}', release.version),
    body: s['release.notifBody'],
    data: { url: UPDATE_URL },
  });
};
