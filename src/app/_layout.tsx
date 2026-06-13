import '@/global.css';

import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/ui';
import { db } from '@/db/client';
import migrations from '@/db/migrations/migrations';
import { AuthProvider } from '@/features/auth/auth-context';
import { seedAdmin } from '@/features/auth/seed';
import { I18nProvider } from '@/i18n';

const MetriTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#bef82b',
    background: '#0b0d12',
    card: '#0b0d12',
    text: '#fefefe',
    border: '#2c3447',
  },
};

const Loading = () => {
  return (
    <View className="flex-1 items-center justify-center bg-ink-900">
      <ActivityIndicator color="#bef82b" />
    </View>
  );
};

const RootLayout = () => {
  const { success, error } = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);

  // Seed the master admin once migrations have created the tables.
  useEffect(() => {
    if (!success) return;
    seedAdmin()
      .catch((e) => console.warn('[seed] failed:', e))
      .finally(() => setSeeded(true));
  }, [success]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-ink-900 px-8">
        <Text className="text-center text-base text-red-400">
          Database failed to initialize:{'\n'}
          {error.message}
        </Text>
      </View>
    );
  }

  if (!success || !seeded) {
    return <Loading />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nProvider>
          <ThemeProvider value={MetriTheme}>
            <AuthProvider>
              <ToastProvider>
                <StatusBar style="light" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#0b0d12' },
                    animation: 'fade',
                  }}
                />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;
