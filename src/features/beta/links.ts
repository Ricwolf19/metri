import { WEB_URL } from '@/lib/env';

const REPO = 'https://github.com/Ricwolf19/metri';

/**
 * Where a beta tester goes to get a newer build.
 *
 * `apk` mirrors metri.info's `lib/site.ts` — a fixed-tag rolling pre-release,
 * deliberately not `releases/latest/download/…`, because release-please cuts a
 * semver release on every feature merge and "latest" would follow it. The tag
 * and the asset name are a contract shared with the website and the APK
 * workflow; changing either 404s all three.
 */
export const betaLinks = {
  apk: `${REPO}/releases/download/apk-beta/metri.apk`,
  releases: `${REPO}/releases`,
  download: `${WEB_URL}/download`,
  /** Ideas, bugs and improvement feedback land on the web contact form. */
  feedback: `${WEB_URL}/contact`,
} as const;
