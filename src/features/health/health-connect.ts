import { Platform } from 'react-native';
import {
  aggregateGroupByDuration,
  aggregateGroupByPeriod,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  requestPermission,
  revokeAllPermissions,
  SdkAvailabilityStatus,
  type Permission,
} from 'react-native-health-connect';

import { dateFromKey, localDateKey } from '@/features/training/dates';
import { openExternal } from '@/lib/open-external';
import { captureError } from '@/lib/telemetry';

import { HEALTH_METRICS, type HealthDay, type HealthMetric } from './health-summary';

/**
 * The ONLY module importing `react-native-health-connect` (Android's Health
 * Connect). metri reads three things, on this phone, when Metrics asks: steps,
 * active energy and sleep. Nothing is stored or synced — a read is the whole
 * life of the data. Weight and body fat are deliberately NOT read: scales and
 * watches disagree, and the week is judged from the lifter's own check-ins.
 * Every call is guarded: no provider, a revoked grant or iOS must never throw
 * into a screen.
 */

/** Android → Health Connect; anything else has no provider yet (HealthKit is a later step). */
export type HealthAvailability = 'unsupported' | 'unavailable' | 'needsProvider' | 'available';

const RECORD_TYPE: Record<HealthMetric, Permission['recordType']> = {
  steps: 'Steps',
  activeEnergy: 'ActiveCaloriesBurned',
  sleep: 'SleepSession',
};

const PERMISSIONS: Permission[] = HEALTH_METRICS.map((m) => ({
  accessType: 'read',
  recordType: RECORD_TYPE[m],
}));

/** Health Connect's Play listing: Android 13 and older install it as an app. */
const PROVIDER_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';

export const healthAvailability = async (): Promise<HealthAvailability> => {
  if (Platform.OS !== 'android') return 'unsupported';
  try {
    const status = await getSdkStatus();
    if (status === SdkAvailabilityStatus.SDK_AVAILABLE) return 'available';
    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED)
      return 'needsProvider';
    return 'unavailable';
  } catch {
    return 'unavailable';
  }
};

/** What `granted` (the provider's list) allows metri to read. */
const metricsIn = (granted: readonly { accessType: string; recordType: string }[]) =>
  HEALTH_METRICS.filter((m) =>
    granted.some((p) => p.accessType === 'read' && p.recordType === RECORD_TYPE[m]),
  );

/** The metrics the lifter has granted; none when the provider is missing. */
export const grantedMetrics = async (): Promise<HealthMetric[]> => {
  try {
    if (!(await initialize())) return [];
    return metricsIn(await getGrantedPermissions());
  } catch {
    return [];
  }
};

/** Ask for all three (the provider lets the lifter pick); what was granted. */
export const connectHealth = async (): Promise<HealthMetric[]> => {
  try {
    if (!(await initialize())) return [];
    return metricsIn(await requestPermission(PERMISSIONS));
  } catch {
    // A dismissed or refused sheet is an answer, not a defect.
    return [];
  }
};

/** Drop every grant: metri reads nothing until connected again. */
export const disconnectHealth = async (): Promise<void> => {
  try {
    await revokeAllPermissions();
  } catch {
    // Already gone, or no provider: nothing left to revoke.
  }
};

/** Health Connect's own screen, where access is reviewed and changed. */
export const openHealthSettings = (): void => {
  try {
    openHealthConnectSettings();
  } catch {
    openExternal(PROVIDER_STORE_URL);
  }
};

export const installHealthProvider = (): void => openExternal(PROVIDER_STORE_URL);

const DAY_MS = 86_400_000;
/** A night is read from 18:00 to 18:00, so the sleep that crosses midnight stays whole. */
const NIGHT_STARTS_AT_HOUR = 18;

/**
 * Health Connect's answers that are not defects (AGENTS "Telemetry is for
 * surprises only"): the read quota is spent (it throws a RemoteException, which
 * the library rejects as `UNDERLYING_ERROR`, naming the quota) — the next
 * foreground reads again — or a grant was taken back in Health Connect's own
 * screens between the check and the read (`PERMISSION_ERROR`). Either way the
 * section shows what it has.
 */
export const isExpectedRefusal = (error: unknown): boolean => {
  const code = (error as { code?: unknown } | null)?.code;
  if (code === 'PERMISSION_ERROR') return true;
  return (
    code === 'UNDERLYING_ERROR' &&
    /rate.?limit|quota/i.test(error instanceof Error ? error.message : '')
  );
};

/**
 * The last `days` days (today included) of whatever was granted, as one row a
 * day. Steps and energy are summed per local calendar day; sleep per night,
 * keyed by the morning it ended on. A missing day is null — unknown, not zero.
 */
export const readHealthDays = async (
  granted: readonly HealthMetric[],
  days: number,
  now: Date = new Date(),
): Promise<HealthDay[]> => {
  const keys = Array.from({ length: days }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1 - i));
    return localDateKey(d);
  });
  const byDay = new Map<string, HealthDay>(
    keys.map((day) => [day, { day, steps: null, activeKcal: null, sleepMin: null }]),
  );
  const first = dateFromKey(keys[0]);
  const range = {
    operator: 'between' as const,
    startTime: first.toISOString(),
    endTime: now.toISOString(),
  };
  const daily = { period: 'DAYS' as const, length: 1 };
  // A period bucket starts at local midnight, printed as a local date-time.
  const dayOf = (startTime: string) => byDay.get(startTime.slice(0, 10));
  // One read failing must not blank the others: each is guarded on its own.
  const guarded = async (read: () => Promise<void>) => {
    try {
      await read();
    } catch (error) {
      // Every read is for a granted type, so a throw is a surprise — unless
      // Health Connect simply said no (`isExpectedRefusal`).
      if (!isExpectedRefusal(error)) captureError(error);
    }
  };

  if (granted.includes('steps'))
    await guarded(async () => {
      const rows = await aggregateGroupByPeriod({
        recordType: 'Steps',
        timeRangeFilter: range,
        timeRangeSlicer: daily,
      });
      for (const r of rows) {
        const row = dayOf(r.startTime);
        if (row && r.result.COUNT_TOTAL > 0) row.steps = Math.round(r.result.COUNT_TOTAL);
      }
    });
  if (granted.includes('activeEnergy'))
    await guarded(async () => {
      const rows = await aggregateGroupByPeriod({
        recordType: 'ActiveCaloriesBurned',
        timeRangeFilter: range,
        timeRangeSlicer: daily,
      });
      for (const r of rows) {
        const row = dayOf(r.startTime);
        const kcal = r.result.ACTIVE_CALORIES_TOTAL?.inKilocalories ?? 0;
        if (row && kcal > 0) row.activeKcal = Math.round(kcal);
      }
    });
  if (granted.includes('sleep'))
    await guarded(async () => {
      // The evening before the first day, by the calendar (24 h back is 23 or 25 across DST).
      const nightStart = new Date(
        first.getFullYear(),
        first.getMonth(),
        first.getDate() - 1,
        NIGHT_STARTS_AT_HOUR,
      );
      const rows = await aggregateGroupByDuration({
        recordType: 'SleepSession',
        timeRangeFilter: { ...range, startTime: nightStart.toISOString() },
        timeRangeSlicer: { duration: 'HOURS', length: 24 },
      });
      for (const r of rows) {
        // A duration bucket starts at an instant; 12 h in is the morning after.
        const morning = localDateKey(new Date(Date.parse(r.startTime) + DAY_MS / 2));
        const row = byDay.get(morning);
        const minutes = Math.round((r.result.SLEEP_DURATION_TOTAL ?? 0) / 60);
        if (row && minutes > 0) row.sleepMin = minutes;
      }
    });
  return keys.map((day) => byDay.get(day)!);
};
