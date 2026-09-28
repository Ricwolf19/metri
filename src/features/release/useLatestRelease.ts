import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/auth-context';
import { API_URL, APP_VERSION } from '@/lib/env';
import { isNetworkFailure } from '@/lib/network-errors';
import { settings } from '@/lib/storage';
import { captureError } from '@/lib/telemetry';

import { isNewerVersion, shouldCheckRelease } from './version';

/**
 * "New version available" indicator. Remote accounts only — a local user never
 * hits the network, so for them this stays quiet forever.
 *
 * The server's latest version is fetched at most once a day and cached in
 * MMKV. A failure (including an older server without the endpoint) is silent:
 * a wrong prompt is worse than none.
 */

/** A gym's flaky signal can hang a request for minutes; a badge is not worth that. */
const TIMEOUT_MS = 8000;

const fetchLatestVersion = async (signal: AbortSignal): Promise<string | null> => {
  const res = await fetch(`${API_URL}/api/latest-version`, { signal });
  if (!res.ok) return null;
  const body = (await res.json().catch(() => null)) as { version?: unknown } | null;
  return typeof body?.version === 'string' ? body.version : null;
};

export const useUpdateAvailable = (): boolean => {
  const { hasServerAccount } = useAuth();
  const [latest, setLatest] = useState(() => settings.getLatestRelease());

  useEffect(() => {
    const now = Date.now();
    const checkedAt = settings.getLatestReleaseCheckedAt();
    if (!shouldCheckRelease({ hasServerAccount, checkedAt, now })) return;
    // Stamped before the request: an offline phone would otherwise fail, stamp
    // nothing, and try again on every mount.
    settings.setLatestReleaseCheckedAt(now);
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    void (async () => {
      try {
        const version = await fetchLatestVersion(controller.signal);
        if (!version) return;
        settings.setLatestRelease(version);
        if (!cancelled) setLatest(version);
      } catch (e) {
        // A timeout is an answer, not a defect.
        if (!controller.signal.aborted && !isNetworkFailure(e)) captureError(e);
      } finally {
        clearTimeout(timer);
      }
    })();
    // No abort on unmount: the attempt is already stamped, so let it land in
    // MMKV for the next mount instead of spending the day's check on nothing.
    return () => {
      cancelled = true;
    };
  }, [hasServerAccount]);

  return hasServerAccount && latest !== null && isNewerVersion(APP_VERSION, latest);
};
