import { Redirect } from 'expo-router';

import { AppLoader } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';

/** Entry gate — route to the app or the auth flow based on the local session. */
const Index = () => {
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) {
    return <AppLoader />;
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/sign-in'} />;
};

export default Index;
