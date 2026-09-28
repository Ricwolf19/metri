/**
 * Version comparison for the "new version available" indicator, numeric per
 * dot segment: `1.11` equals `1.11.0` (a missing segment counts as 0). A
 * leading `v` (tag spelling) and `+build` metadata are ignored — semver gives
 * build metadata no precedence. A pre-release (`1.12.0-beta.1`) on either side
 * never reports: the beta channel ships those, and ordering them against
 * releases is where a wrong prompt would come from — a confusing prompt is
 * worse than none. Anything else non-numeric never reports either.
 */

const parse = (v: string): number[] | null => {
  const core = v.trim().replace(/^v/i, '').split('+')[0];
  if (!/^\d+(\.\d+)*$/.test(core)) return null;
  return core.split('.').map(Number);
};

/** True when `latest` is a strictly newer, well-formed version than `installed`. */
export const isNewerVersion = (installed: string, latest: string): boolean => {
  const a = parse(installed);
  const b = parse(latest);
  if (!a || !b) return false;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (y > x) return true;
    if (y < x) return false;
  }
  return false;
};

/** At most one check a day. */
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

/**
 * Whether to ask the server for the latest version now. A local account never
 * hits the network, however stale the cache; a remote one asks once a day,
 * counted from the last ATTEMPT so an offline phone does not retry every mount.
 */
export const shouldCheckRelease = ({
  hasServerAccount,
  checkedAt,
  now,
}: {
  hasServerAccount: boolean;
  checkedAt: number;
  now: number;
}): boolean =>
  // A stamp in the future means the clock went back: without the escape it
  // would mute the check until the clock caught up again.
  hasServerAccount && (checkedAt > now || now - checkedAt >= CHECK_INTERVAL_MS);
