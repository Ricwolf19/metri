import * as Sentry from '@sentry/react-native';
import * as Updates from 'expo-updates';

/**
 * The app's single gateway to Sentry — screens and features never import
 * `@sentry/react-native` directly, so what leaves the device is auditable in
 * one file and the legal copy (`features/legal/content.ts`) can stay true.
 *
 * The DSN is a public client key, not a secret; empty string keeps telemetry
 * fully off (a clean no-op, mirroring the web's missing-env behavior).
 * Rotation ships as an OTA update. Disabled in dev builds — the local sync
 * panel covers debugging there.
 */
const SENTRY_DSN =
  'https://d7d375c91c1deb6670ce31e9476f7e22@o4511656635006976.ingest.us.sentry.io/4511843228844032';

const enabled = !!SENTRY_DSN && !__DEV__;

export const initTelemetry = (): void => {
  if (!enabled) return;
  Sentry.init({
    dsn: SENTRY_DSN,
    // Identity is set explicitly as the account id only (setTelemetryUser);
    // never emails, names, or request bodies.
    sendDefaultPii: false,
    // Matches the web: enough tracing to see patterns, cheap enough to stay
    // inside the free tier.
    tracesSampleRate: 0.1,
  });
  // With the fingerprint runtimeVersion policy + OTA, "which JS on which
  // binary" is the first triage question — answer it on every event.
  Sentry.setTag('runtimeVersion', Updates.runtimeVersion ?? 'unknown');
  Sentry.setTag('update', Updates.updateId ?? 'embedded');
  Sentry.setTag('channel', Updates.channel ?? 'none');
};

type RootComponent = React.ComponentType<Record<string, unknown>>;

/** Touch/navigation instrumentation + error boundary around the root layout. */
export const wrapRoot = (Root: RootComponent): RootComponent =>
  enabled ? Sentry.wrap(Root) : Root;

/** Account id only — pass null on sign-out. */
export const setTelemetryUser = (id: string | null): void => {
  if (!enabled) return;
  Sentry.setUser(id ? { id } : null);
};

/** Report a handled error (sync failures, guarded native calls). */
export const captureError = (error: unknown): void => {
  if (!enabled) return;
  Sentry.captureException(error);
};
