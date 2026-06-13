import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/features/auth/auth-context';

/** Auth flow — bounce to the app if already signed in. */
const AuthLayout = () => {
  const { isReady, isAuthenticated } = useAuth();

  if (isReady && isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
};

export default AuthLayout;
