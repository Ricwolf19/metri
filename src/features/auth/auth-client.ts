import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

import { API_URL } from '@/lib/env';

/**
 * Better Auth CLIENT for the shared metri.info backend. The server (Next.js API
 * route + Neon) owns accounts, sessions and secrets; this client only makes
 * authenticated HTTP calls and stores the session in SecureStore.
 *
 * The backend origin is resolved per-environment in `app.config.ts` (`API_URL`);
 * the `expo` server plugin + `metri://` trusted origin must be enabled there.
 */
export const AUTH_BASE_URL = API_URL;

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
  plugins: [
    expoClient({
      scheme: 'metri',
      storagePrefix: 'metri',
      storage: SecureStore,
    }),
  ],
});
