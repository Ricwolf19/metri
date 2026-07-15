import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Backend origin per environment (like metri.info's local vs Vercel env split).
 * `NODE_ENV` is production in release/EAS builds and development otherwise. On
 * the Android emulator `10.0.2.2` is the host machine's localhost. Set
 * `EXPO_PUBLIC_AUTH_URL` to override (iOS simulator, physical device, tunnel).
 */
const apiUrl =
  process.env.EXPO_PUBLIC_AUTH_URL ??
  (process.env.NODE_ENV === 'production' ? 'https://metri.info' : 'http://10.0.2.2:3000');

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  extra: { ...config.extra, apiUrl },
});
