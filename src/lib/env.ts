import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };

/** Backend origin for the shared metri.info Better Auth + sync API. */
export const API_URL = extra.apiUrl ?? 'https://metri.info';

/** True in dev/debug builds, false in release. */
export const IS_DEV = __DEV__;
