/**
 * The `/api/latest-version` payload, validated field by field. It arrives from
 * the network and is cached in MMKV, where it outlives app updates — so both
 * the fresh response and the cached copy go through `parseLatestRelease`, and
 * anything that does not match is dropped rather than half-trusted.
 */
export type LatestRelease = {
  version: string;
  tag: string;
  /** expo-updates runtime of the build; equal to the installed one means OTA reaches it. */
  runtimeVersion: string;
  apkUrl: string;
  sha256: string;
  sizeBytes: number;
  /** Markdown changelog. */
  notes: string;
  /** ISO timestamp. */
  publishedAt: string;
  releaseUrl: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const str = (value: unknown): value is string => typeof value === 'string';

// Only https links are ever handed to `Linking.openURL` from a payload.
const httpsUrl = (value: unknown): value is string => str(value) && /^https:\/\/\S+$/i.test(value);

/** Unknown extra fields are ignored. */
export const parseLatestRelease = (raw: unknown): LatestRelease | null => {
  if (!isRecord(raw)) return null;
  const {
    version,
    tag,
    runtimeVersion,
    apkUrl,
    sha256,
    sizeBytes,
    notes,
    publishedAt,
    releaseUrl,
  } = raw;
  if (!str(version) || !version.trim()) return null;
  if (!str(tag) || !str(runtimeVersion) || !str(sha256) || !str(notes)) return null;
  if (!httpsUrl(apkUrl) || !httpsUrl(releaseUrl)) return null;
  if (typeof sizeBytes !== 'number' || !Number.isFinite(sizeBytes) || sizeBytes < 0) return null;
  if (!str(publishedAt) || Number.isNaN(Date.parse(publishedAt))) return null;
  return {
    version,
    tag,
    runtimeVersion,
    apkUrl,
    sha256,
    sizeBytes,
    notes,
    publishedAt,
    releaseUrl,
  };
};
