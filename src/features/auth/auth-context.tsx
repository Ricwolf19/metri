import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import type { PublicUser, UserRole } from '@/db/schema';
import { useI18n } from '@/i18n';
import { session, settings } from '@/lib/storage';
import { setTelemetryUser } from '@/lib/telemetry';

import { authClient } from './auth-client';
import { pushProfile, restoreRemoteProfile } from './profile-sync';
import { can as canFeature, type Feature } from './entitlements';
import {
  completeOnboarding,
  findById,
  updateAccount,
  updateProfile,
  upsertRemoteUser,
  type AccountUpdate,
  type ProfileUpdate,
} from './users.repo';

type AuthContextValue = {
  user: PublicUser | null;
  isReady: boolean;
  isAuthenticated: boolean;
  /** Cloud sign-in against the shared metri.info backend (email). Links a local user. */
  /** Resolves with whether the account profile was restored (skip onboarding). */
  signInRemote: (email: string, password: string) => Promise<{ restored: boolean }>;
  /** Cloud sign-up. Returns whether the backend requires email verification first. */
  signUpRemote: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<{ needsVerification: boolean }>;
  signOut: () => void;
  updateMyProfile: (patch: ProfileUpdate) => void;
  updateMyAccount: (patch: AccountUpdate) => Promise<void>;
  changeMyPassword: (current: string, next: string) => Promise<void>;
  finishOnboarding: (patch: ProfileUpdate) => void;
  reload: () => void;
  hasRole: (role: UserRole) => boolean;
  /** True when the user's plan unlocks premium features. */
  isPremium: boolean;
  /** Feature-gate check derived from the user's plan (entitlements). */
  can: (feature: Feature) => boolean;
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
        throw new Error(res.error.message ?? 'Cloud sign-in failed.');
      }
      // Anchor on-device data to a local row mirroring the remote account, caching
      // the server-set entitlement plan for offline reads.
      const local = await upsertRemoteUser({
        email: res.data.user.email,
        displayName: res.data.user.name,
        plan: (res.data.user as { plan?: string }).plan,
      });
      session.setUserId(local.id);
      // Restore the account profile (metrics + preferences) before first render:
      // a reinstall then lands on Home greeted, not on onboarding.
      const restored = await restoreRemoteProfile(local.id);
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
      throw new Error(res.error.message ?? 'Cloud sign-up failed.');
    }
    // The backend requires email verification, so no session is issued yet —
    // the user must verify before signing in.
    return { needsVerification: !res.data.token };
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

  const updateMyAccount = useCallback(
    async (patch: AccountUpdate) => {
      if (!user) return;
      const next = await updateAccount(user.id, patch);
      setUser(next);
    },
    [user],
  );

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

    // Offline or unreachable resolves to null and is treated as "keep the local
    // session" — only an explicit no-session response signs the user out.
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
  const isPremium = user?.plan === 'premium';

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      isAuthenticated: !!user,
      signInRemote,
      signUpRemote,
      signOut,
      updateMyProfile,
      updateMyAccount,
      changeMyPassword,
      finishOnboarding,
      reload,
      hasRole,
      isPremium,
      can,
    }),
    [
      user,
      isReady,
      signInRemote,
      signUpRemote,
      signOut,
      isPremium,
      can,
      updateMyProfile,
      updateMyAccount,
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
