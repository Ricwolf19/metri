import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/features/auth/auth-context';

/** Auth flow — bounce to the app if already signed in. */
const AuthLayout = () => {
  const { isReady, isAuthenticated, isLocalOnly } = useAuth();

  // Local-only users must reach this group to link the account that adopts their data;
  // only server-backed sessions bounce to the app.
  if (isReady && isAuthenticated && !isLocalOnly) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
};

export default AuthLayout;
