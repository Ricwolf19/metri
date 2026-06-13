import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/features/auth/auth-context';

/** Entry gate — route to the app or the auth flow based on the local session. */
const Index = () => {
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-ink-900">
        <ActivityIndicator color="#bef82b" />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/sign-in'} />;
};

export default Index;
