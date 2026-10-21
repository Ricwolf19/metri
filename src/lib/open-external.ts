import { Linking } from 'react-native';

/**
 * Hands a URL to the OS: the browser, the mail client, whatever owns the
 * scheme. A refusal (no browser installed, a scheme nothing handles) is
 * swallowed on purpose — the lifter already sees nothing happen, and it is
 * environmental, not a defect worth a report. Internal `metri://` links from
 * notifications take their own validated path (`notifications/app-link.ts`).
 */
export const openExternal = (url: string): void => {
  void Linking.openURL(url).catch(() => {});
};
