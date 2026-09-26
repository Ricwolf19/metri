import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/auth-context';
import { API_URL, APP_VERSION } from '@/lib/env';
import { isNetworkFailure } from '@/lib/network-errors';
import { settings } from '@/lib/storage';
import { captureError } from '@/lib/telemetry';

import { isNewerVersion } from './version';

/**
 * "New version available" indicator. Remote accounts only — a local user never
 * hits the network, so for them this stays quiet forever.
 *
 * The server's latest version is fetched at most once a day and cached in
 * MMKV. A failure (including an older server without the endpoint) is silent:
 * a wrong prompt is worse than none.
 */

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

const fetchLatestVersion = async (): Promise<string | null> => {
  const res = await fetch(`${API_URL}/api/latest-version`);
  if (!res.ok) return null;
  const body = (await res.json().catch(() => null)) as { version?: unknown } | null;
  return typeof body?.version === 'string' ? body.version : null;
};

export const useUpdateAvailable = (): boolean => {
  const { hasServerAccount } = useAuth();
  const [latest, setLatest] = useState(() => settings.getLatestRelease());

  useEffect(() => {
    if (!hasServerAccount) return;
    if (Date.now() - settings.getLatestReleaseCheckedAt() < CHECK_INTERVAL_MS) return;
    let cancelled = false;
    void (async () => {
      try {
        const version = await fetchLatestVersion();
        settings.setLatestReleaseCheckedAt(Date.now());
        if (!version) return;
        settings.setLatestRelease(version);
        if (!cancelled) setLatest(version);
      } catch (e) {
        if (!isNetworkFailure(e)) captureError(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasServerAccount]);

  return hasServerAccount && latest !== null && isNewerVersion(APP_VERSION, latest);
};
