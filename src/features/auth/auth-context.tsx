import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import type { PublicUser, UserRole } from '@/db/schema';
import { useI18n } from '@/i18n';
import { session, settings } from '@/lib/storage';
import { setTelemetryUser } from '@/lib/telemetry';

import { authClient } from './auth-client';
import { pushProfile, restoreRemoteProfile } from './profile-sync';
import { can as canFeature, getTier, type Feature, type Tier } from './entitlements';
import {
  adoptLocalUser,
  completeOnboarding,
  createLocalUser,
  findById,
  updateProfile,
  upsertRemoteUser,
  type ProfileUpdate,
} from './users.repo';

/**
 * The server rejected the credentials themselves — wrong password, unverified
 * email, an address already taken. An expected answer the screens translate for
 * the user, never a defect, so it is never reported to telemetry.
 */
export class AuthRejectedError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'AuthRejectedError';
    this.status = status;
  }
}

type AuthContextValue = {
  user: PublicUser | null;
  isReady: boolean;
  isAuthenticated: boolean;
  /** Cloud sign-in (adopts a local user). `restored` means the server profile came
   * back, so onboarding is skipped. */
  signInRemote: (email: string, password: string) => Promise<{ restored: boolean }>;
  /** Cloud sign-up. Returns whether the backend requires email verification first. */
  signUpRemote: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<{ needsVerification: boolean }>;
  /** Start using the app with a device-only user — no server account at all. */
  startLocal: (displayName: string) => Promise<void>;
  signOut: () => void;
  updateMyProfile: (patch: ProfileUpdate) => void;
  changeMyPassword: (current: string, next: string) => Promise<void>;
  finishOnboarding: (patch: ProfileUpdate) => void;
  reload: () => void;
  hasRole: (role: UserRole) => boolean;
  isPremium: boolean;
  /** Feature-gate check derived from the user's plan (entitlements). */
  can: (feature: Feature) => boolean;
  isLocalOnly: boolean;
  hasServerAccount: boolean;
  tier: Tier;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setLocale } = useI18n();
  // The session lives in MMKV and the user in SQLite — both synchronous — so the
  // signed-in user is resolved lazily at mount with no effect and no spinner flash.
  // (Migrations + seed are already gated by the root layout before this mounts.)
  const [user, setUser] = useState<PublicUser | null>(() => {
    const id = session.getUserId();
    return id ? findById(id) : null;
  });
  const isReady = true;

  // One choke point for crash-report identity: covers sign-in, sign-out and
  // revalidation alike. Account id only — never email or name.
  useEffect(() => {
    setTelemetryUser(user?.id ?? null);
  }, [user?.id]);

  const reload = useCallback(() => {
    const id = session.getUserId();
    setUser(id ? findById(id) : null);
  }, []);

  const signInRemote = useCallback(
    async (email: string, password: string) => {
      const res = await authClient.signIn.email({ email: email.trim().toLowerCase(), password });
      if (res.error) {
        throw new AuthRejectedError(
          res.error.status ?? 0,
          res.error.message ?? 'Cloud sign-in failed.',
        );
      }
      // Adopt-first: a local-only user's row becomes the mirror (same id — AGENTS.md); otherwise anchor by email.
      const currentId = session.getUserId();
      const current = currentId ? findById(currentId) : null;
      const remote = {
        email: res.data.user.email,
        displayName: res.data.user.name,
        plan: (res.data.user as { plan?: string }).plan,
      };
      const local =
        current?.authKind === 'local'
          ? (adoptLocalUser(current.id, remote) ?? (await upsertRemoteUser(remote)))
          : await upsertRemoteUser(remote);
      session.setUserId(local.id);
      // Restore the account profile (metrics + preferences) before first render:
      // a reinstall then lands on Home greeted, not on onboarding. For a freshly
      // adopted local user the server has nothing yet — push our profile up.
      const restored = await restoreRemoteProfile(local.id);
      if (current?.authKind === 'local' && !restored) {
        const adopted = findById(local.id);
        if (adopted) pushProfile(adopted);
      }
      // The restore writes preferences straight to MMKV, but the i18n provider
      // holds the locale in React state — re-apply it or the whole UI (including
      // the "restored" toast) stays in the pre-sign-in language until relaunch.
      const savedLocale = settings.getLocale();
      if (savedLocale) setLocale(savedLocale);
      setUser(findById(local.id) ?? local);
      return { restored };
    },
    [setLocale],
  );

  const signUpRemote = useCallback(async (email: string, password: string, name?: string) => {
    const res = await authClient.signUp.email({
      email: email.trim().toLowerCase(),
      password,
      name: name?.trim() || email.split('@')[0],
    });
    if (res.error) {
      throw new AuthRejectedError(
        res.error.status ?? 0,
        res.error.message ?? 'Cloud sign-up failed.',
      );
    }
    // Usually no session yet (email verification; adopt happens on the later sign-in).
    // If one IS issued, anchor/adopt now so a local user upgrades in one step.
    if (!res.data.token) return { needsVerification: true };
    const currentId = session.getUserId();
    const current = currentId ? findById(currentId) : null;
    const remote = {
      email: res.data.user.email,
      displayName: res.data.user.name,
      plan: (res.data.user as { plan?: string }).plan,
    };
    const local =
      current?.authKind === 'local'
        ? (adoptLocalUser(current.id, remote) ?? (await upsertRemoteUser(remote)))
        : await upsertRemoteUser(remote);
    session.setUserId(local.id);
    const adopted = findById(local.id);
    if (adopted) {
      pushProfile(adopted);
      setUser(adopted);
    }
    return { needsVerification: false };
  }, []);

  const signOut = useCallback(() => {
    void authClient.signOut().catch(() => {});
    session.clear();
    setUser(null);
  }, []);

  const updateMyProfile = useCallback(
    (patch: ProfileUpdate) => {
      if (!user) return;
      const next = updateProfile(user.id, patch);
      if (next) {
        setUser(next);
        pushProfile(next);
      }
    },
    [user],
  );

  const startLocal = useCallback(async (displayName: string) => {
    const local = await createLocalUser({ displayName });
    // Same MMKV key the widget's headless handler reads.
    session.setUserId(local.id);
    setUser(local);
  }, []);

  const changeMyPassword = useCallback(async (current: string, next: string) => {
    // Passwords live on the remote Better Auth account (the local hash is a
    // throwaway placeholder), so change it there.
    const res = await authClient.changePassword({ currentPassword: current, newPassword: next });
    if (res.error) throw new Error(res.error.message ?? 'Password change failed.');
  }, []);

  const finishOnboarding = useCallback(
    (patch: ProfileUpdate) => {
      if (!user) return;
      const next = completeOnboarding(user.id, patch);
      if (next) {
        setUser(next);
        pushProfile(next);
      }
    },
    [user],
  );

  /**
   * Reconcile the local session with the server's.
   *
   * The gate used to be `!!user`, derived purely from an unencrypted MMKV id —
   * so a deleted, suspended or remotely signed-out account stayed unlocked
   * forever, and writing that key on a rooted device was a full bypass.
   *
   * Offline-first constrains the fix: only an *explicit* "no session" from the
   * server signs the user out. A network failure leaves local state untouched,
   * so the app keeps working at the gym with no signal. A successful check also
   * refreshes the cached `plan`, which is what gates sync.
   */
  const revalidate = useCallback(async () => {
    const before = session.getUserId();
    if (!before) return;
    // Local users have no server session; an empty getSession() would read as "signed out remotely".
    if (findById(before)?.authKind === 'local') return;

    // null = offline or unreachable: keep the local session.
    const res = await authClient.getSession().catch(() => null);
    if (!res || res.error) return;

    // The user may have signed out while this was in flight; re-applying the
    // resolved session would silently sign them back in.
    if (session.getUserId() !== before) return;

    if (!res.data?.user) {
      session.clear();
      setUser(null);
      return;
    }
    const local = await upsertRemoteUser({
      email: res.data.user.email,
      displayName: res.data.user.name,
      plan: (res.data.user as { plan?: string }).plan,
    });
    if (session.getUserId() !== before) return;
    session.setUserId(local.id);
    setUser(local);
  }, []);

  useEffect(() => {
    // `.catch` on both call sites: `upsertRemoteUser` can throw (unique
    // email/username, SQLite), and a bare `void` would surface that as an
    // unhandled rejection nobody sees in production.
    const run = () => void revalidate().catch(() => {});
    const timer = setTimeout(run, 0);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') run();
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [revalidate]);

  const hasRole = useCallback((role: UserRole) => user?.role === role, [user]);
  const can = useCallback((feature: Feature) => canFeature(user?.plan, feature), [user]);
  const isPremium = canFeature(user?.plan, 'sync');

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      isAuthenticated: !!user,
      signInRemote,
      signUpRemote,
      startLocal,
      signOut,
      updateMyProfile,
      changeMyPassword,
      finishOnboarding,
      reload,
      hasRole,
      isPremium,
      can,
      isLocalOnly: user?.authKind === 'local',
      hasServerAccount: user?.authKind === 'remote',
      tier: getTier(user),
    }),
    [
      user,
      isReady,
      signInRemote,
      signUpRemote,
      startLocal,
      signOut,
      isPremium,
      can,
      updateMyProfile,
      changeMyPassword,
      finishOnboarding,
      reload,
      hasRole,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>.');
  return ctx;
};
