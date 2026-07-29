import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };

/** Backend origin for the shared metri.info Better Auth + sync API. */
export const API_URL = extra.apiUrl ?? 'https://metri.info';

/** The public marketing site. Always production, unlike `API_URL`. */
export const WEB_URL = 'https://metri.info';

/**
 * The running app version. Comes from the loaded manifest, so after an
 * over-the-air update it reports the version the user is actually running —
 * not the one baked into the installed APK.
 */
export const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';
