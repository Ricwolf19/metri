// app.json → `scheme`.
const APP_SCHEME = 'metri://';

/**
 * The deep link a tapped notification may open, or null. Only the app's own
 * scheme passes: a tap hands the URL to `Linking.openURL`, and a payload that
 * named a web page (or `javascript:`) would open it outside the app with the
 * user's trust in "a metri notification" behind it.
 */
export const appLinkFrom = (data: unknown): string | null => {
  const url = (data as { url?: unknown } | null | undefined)?.url;
  return typeof url === 'string' && url.startsWith(APP_SCHEME) ? url : null;
};
