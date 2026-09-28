import type { Locale } from '@/i18n';
import { WEB_URL } from '@/lib/env';

const REPO = 'https://github.com/Ricwolf19/metri';

/**
 * Where a beta tester goes to get a newer build. There is no direct APK link on
 * purpose: the asset name carries the version, and GitHub's "latest" release
 * exists for about an hour before its APK is attached. The website's download
 * page reads each release's `release.json`, so it always links a build that exists.
 */
export const betaLinks = {
  releases: `${REPO}/releases`,
  download: `${WEB_URL}/download`,
  /** Ideas, bugs and improvement feedback land on the web contact form. */
  feedback: `${WEB_URL}/contact`,
} as const;

/**
 * The website's download page in the app's language. Opening it is a plain
 * browser link, so local users get it too — the app itself never fetches.
 */
export const downloadPageUrl = (locale: Locale): string =>
  locale === 'es' ? `${WEB_URL}/es/descargar` : betaLinks.download;
