/**
 * Tells an expected connectivity failure apart from a defect, by message.
 *
 * A phone at the gym loses signal constantly and the app is offline-first, so
 * these are normal operation, not bug reports. Expo SDK 57 installs `expo/fetch`
 * as the global `fetch`, which reports them as `fetch failed: <native message>`
 * carrying a single native frame; the other spellings cover React Native's own
 * polyfill and the layers underneath it.
 */
const NETWORK_FAILURE =
  /fetch failed|Network request failed|Unable to resolve host|UnknownHostException|ENOTFOUND|ECONNREFUSED|ECONNRESET|EHOSTUNREACH|ETIMEDOUT|SocketTimeout|timed out|connection abort|Internet connection appears to be offline/i;

export const isNetworkFailure = (value: unknown): boolean => {
  const message = value instanceof Error ? value.message : typeof value === 'string' ? value : '';
  return message.length > 0 && NETWORK_FAILURE.test(message);
};
