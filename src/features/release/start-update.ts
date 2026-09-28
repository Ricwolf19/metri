import { Linking } from 'react-native';

import { applyOtaUpdate } from './ota';
import type { AppUpdate } from './useAppUpdate';

/** The one primary action: restart into a staged OTA, or hand the APK to the browser. */
export const startUpdate = ({ release, kind }: AppUpdate): void => {
  if (kind === 'ota') void applyOtaUpdate();
  // No browser, or a URL the OS refuses: the user sees nothing happen — not a defect.
  else void Linking.openURL(release.apkUrl).catch(() => {});
};
