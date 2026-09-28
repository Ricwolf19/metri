import * as Updates from 'expo-updates';

import { APP_VERSION } from '@/lib/env';
import { isNetworkFailure } from '@/lib/network-errors';
import { captureError } from '@/lib/telemetry';

import type { LatestRelease } from './payload';
import { updateKind, type UpdateKind } from './update-kind';

/**
 * The only module touching expo-updates for the in-app update flow (telemetry
 * reads its constants for tags). Every call is try/caught: an update that fails
 * to download is retried by the next check, and connectivity loss is an answer,
 * not a defect.
 */

const report = (e: unknown): void => {
  if (!isNetworkFailure(e)) captureError(e);
};

/**
 * How `latest` reaches THIS install. An OTA release is only actionable when
 * expo-updates is enabled — a dev build has no channel, so it shows nothing.
 */
export const currentUpdateKind = (latest: LatestRelease): UpdateKind => {
  const kind = updateKind({
    installedVersion: APP_VERSION,
    installedRuntime: Updates.runtimeVersion,
    latest,
  });
  return kind === 'ota' && !Updates.isEnabled ? 'none' : kind;
};

let staging: Promise<boolean> | null = null;

/**
 * Download the channel's update so a restart applies it; resolves true once a
 * new one is staged. Shared across callers (Home and Profile both render the
 * card). Only success is memoized: a failure, or a channel that has not
 * published yet (the API can announce before `eas update` lands), is forgotten
 * so the next mount retries instead of hiding the card for the process.
 */
export const stageOtaUpdate = (): Promise<boolean> => {
  if (!Updates.isEnabled) return Promise.resolve(false);
  staging ??= (async () => {
    let staged = false;
    try {
      const check = await Updates.checkForUpdateAsync();
      if (check.isAvailable) staged = (await Updates.fetchUpdateAsync()).isNew;
    } catch (e) {
      report(e);
    }
    if (!staged) staging = null;
    return staged;
  })();
  return staging;
};

/** Restart into the staged update. Resolves false if the reload could not start. */
export const applyOtaUpdate = async (): Promise<boolean> => {
  try {
    await Updates.reloadAsync();
    return true;
  } catch (e) {
    report(e);
    return false;
  }
};
