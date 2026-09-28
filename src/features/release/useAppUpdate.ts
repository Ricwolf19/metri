import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/auth-context';
import { API_URL } from '@/lib/env';
import { isNetworkFailure } from '@/lib/network-errors';
import { settings } from '@/lib/storage';
import { captureError } from '@/lib/telemetry';

import { notifyReleaseOnce } from './notify';
import { currentUpdateKind, stageOtaUpdate } from './ota';
import { parseLatestRelease, type LatestRelease } from './payload';
import { shouldCheckRelease } from './version';

/**
 * The in-app update, for remote accounts only — a local user never hits the
 * network, so for them this stays null forever (they get the download link).
 *
 * The server's latest release is fetched at most once a day and cached in MMKV.
 * A failure (including an older server without the endpoint, or a payload that
 * does not validate) is silent: a wrong prompt is worse than none.
 */

// A gym's flaky signal can hang a request for minutes; an update card is not worth that.
const TIMEOUT_MS = 8000;

/** `ota` means the update is already downloaded: a restart applies it. */
export type AppUpdate = { release: LatestRelease; kind: 'ota' | 'apk' };

const fetchLatestRelease = async (signal: AbortSignal): Promise<LatestRelease | null> => {
  const res = await fetch(`${API_URL}/api/latest-version`, { signal });
  if (!res.ok) return null;
  return parseLatestRelease(await res.json().catch(() => null));
};

export const useAppUpdate = (): AppUpdate | null => {
  const { hasServerAccount } = useAuth();
  const [release, setRelease] = useState(() =>
    parseLatestRelease(settings.getLatestReleasePayload()),
  );
  const [otaStaged, setOtaStaged] = useState(false);

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
        const latest = await fetchLatestRelease(controller.signal);
        if (!latest) return;
        settings.setLatestReleasePayload(latest);
        if (!cancelled) setRelease(latest);
        await notifyReleaseOnce(latest);
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

  const kind = hasServerAccount && release ? currentUpdateKind(release) : 'none';

  useEffect(() => {
    if (kind !== 'ota') return;
    let cancelled = false;
    void stageOtaUpdate().then((staged) => {
      if (!cancelled) setOtaStaged(staged);
    });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  if (!release || kind === 'none') return null;
  // An OTA the channel has not delivered yet is not actionable: show nothing.
  if (kind === 'ota' && !otaStaged) return null;
  return { release, kind };
};
