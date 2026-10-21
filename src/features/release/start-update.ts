import { openExternal } from '@/lib/open-external';

import { applyOtaUpdate } from './ota';
import type { AppUpdate } from './useAppUpdate';

/** The one primary action: restart into a staged OTA, or hand the APK to the browser. */
export const startUpdate = ({ release, kind }: AppUpdate): void => {
  if (kind === 'ota') void applyOtaUpdate();
  else openExternal(release.apkUrl);
};
