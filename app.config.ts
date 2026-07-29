import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Backend origin. Production is the fail-safe default: the dev URL (`10.0.2.2`
 * = the Android emulator's host loopback) requires an explicit
 * `NODE_ENV=development`, because this config is also evaluated in contexts
 * with no NODE_ENV at all (EAS builder, `eas update` in CI) and those must
 * resolve production. Override with `EXPO_PUBLIC_AUTH_URL` (iOS simulator,
 * physical device, tunnel). @see AGENTS.md "CI & release".
 */
const apiUrl =
  process.env.EXPO_PUBLIC_AUTH_URL ??
  (process.env.NODE_ENV === 'development' ? 'http://10.0.2.2:3000' : 'https://metri.info');

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  extra: { ...config.extra, apiUrl },
});
