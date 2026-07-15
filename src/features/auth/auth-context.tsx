import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { PublicUser, UserRole } from '@/db/schema';
import { session } from '@/lib/storage';

import { authClient } from './auth-client';
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
  signInRemote: (email: string, password: string) => Promise<void>;
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
  // The session lives in MMKV and the user in SQLite — both synchronous — so the
  // signed-in user is resolved lazily at mount with no effect and no spinner flash.
  // (Migrations + seed are already gated by the root layout before this mounts.)
  const [user, setUser] = useState<PublicUser | null>(() => {
    const id = session.getUserId();
    return id ? findById(id) : null;
  });
  const isReady = true;

  const reload = useCallback(() => {
    const id = session.getUserId();
    setUser(id ? findById(id) : null);
  }, []);

  const signInRemote = useCallback(async (email: string, password: string) => {
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
    setUser(local);
  }, []);

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
      if (next) setUser(next);
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
      if (next) setUser(next);
    },
    [user],
  );

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
