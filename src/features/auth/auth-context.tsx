import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { PublicUser, UserRole } from '@/db/schema';
import { session } from '@/lib/storage';

import {
  changePassword,
  completeOnboarding,
  createUser,
  findById,
  updateAccount,
  updateProfile,
  verifyCredentials,
  type AccountUpdate,
  type CreateUserInput,
  type ProfileUpdate,
} from './users.repo';

type AuthContextValue = {
  user: PublicUser | null;
  isReady: boolean;
  isAuthenticated: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (input: CreateUserInput) => Promise<void>;
  signOut: () => void;
  updateMyProfile: (patch: ProfileUpdate) => void;
  updateMyAccount: (patch: AccountUpdate) => Promise<void>;
  changeMyPassword: (current: string, next: string) => Promise<void>;
  finishOnboarding: (patch: ProfileUpdate) => void;
  reload: () => void;
  hasRole: (role: UserRole) => boolean;
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

  const signIn = useCallback(async (identifier: string, password: string) => {
    const found = await verifyCredentials(identifier, password);
    if (!found) throw new Error('Wrong email/username or password.');
    session.setUserId(found.id);
    setUser(found);
  }, []);

  const signUp = useCallback(async (input: CreateUserInput) => {
    const created = await createUser(input);
    session.setUserId(created.id);
    setUser(created);
  }, []);

  const signOut = useCallback(() => {
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

  const changeMyPassword = useCallback(
    async (current: string, next: string) => {
      if (!user) return;
      await changePassword(user.id, current, next);
    },
    [user],
  );

  const finishOnboarding = useCallback(
    (patch: ProfileUpdate) => {
      if (!user) return;
      const next = completeOnboarding(user.id, patch);
      if (next) setUser(next);
    },
    [user],
  );

  const hasRole = useCallback((role: UserRole) => user?.role === role, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      isAuthenticated: !!user,
      signIn,
      signUp,
      signOut,
      updateMyProfile,
      updateMyAccount,
      changeMyPassword,
      finishOnboarding,
      reload,
      hasRole,
    }),
    [
      user,
      isReady,
      signIn,
      signUp,
      signOut,
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
