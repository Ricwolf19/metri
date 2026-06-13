import '@/global.css';

import { Stack, ThemeProvider as NavThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppLoader, ToastProvider } from '@/components/ui';
import { db } from '@/db/client';
import migrations from '@/db/migrations/migrations';
import { AuthProvider } from '@/features/auth/auth-context';
import { seedAdmin } from '@/features/auth/seed';
import { initNotifications } from '@/features/reminders/scheduler';
import { I18nProvider } from '@/i18n';
import { ThemeProvider, useTheme } from '@/theme/theme-context';

// Hold the native splash, then hand off to the in-app animated AppLoader so the
// branded logo stays continuous from launch into the migration/seed phase.
void SplashScreen.preventAutoHideAsync();

/** The navigation shell — themed once the providers are mounted. */
const ThemedStack = () => {
  const { navTheme, statusBarStyle } = useTheme();
  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={statusBarStyle} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: navTheme.colors.background },
          animation: 'fade',
        }}
      />
    </NavThemeProvider>
  );
};

const RootLayout = () => {
  const { success, error } = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);

  // Reveal our animated AppLoader as soon as JS mounts (native splash → AppLoader).
  useEffect(() => {
    void SplashScreen.hideAsync();
    void initNotifications().catch(() => {});
  }, []);

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
    return <AppLoader />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nProvider>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <ThemedStack />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;
